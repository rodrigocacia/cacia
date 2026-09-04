import { describe, expect, it, vi } from 'vitest';
import { RemindersService } from './reminders.service';
import type { PrismaService } from '@/infra/prisma/prisma.service';

/**
 * Estes testes cobrem as três falhas encontradas no diagnóstico do sistema
 * anterior. Cada uma perdia ou duplicava aviso de prazo em produção.
 */

function prismaEspiao(opcoes: { updateManyCount?: number } = {}) {
  const findMany = vi.fn().mockResolvedValue([]);
  const update = vi.fn().mockResolvedValue({});
  const updateMany = vi
    .fn()
    .mockResolvedValue({ count: opcoes.updateManyCount ?? 1 });

  const prisma = {
    reminder: { findMany, update, updateMany, findFirst: vi.fn() },
  } as unknown as PrismaService;

  return { prisma, findMany, update, updateMany };
}

function argsDe(espiao: ReturnType<typeof vi.fn>, chamada = 0) {
  return espiao.mock.calls[chamada]?.[0] as {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  };
}

describe('RemindersService', () => {
  describe('busca de pendentes — a falha que perdia lembretes', () => {
    it('não usa janela de tempo: aceita qualquer lembrete vencido', async () => {
      // A implementação anterior filtrava trigger_at entre agora e 5 min atrás.
      // Um deploy nessa janela fazia o lembrete envelhecer para fora do
      // intervalo e nunca mais ser encontrado.
      const { prisma, findMany } = prismaEspiao();

      await new RemindersService(prisma).buscarPendentes();

      const where = argsDe(findMany).where as {
        triggerAt: Record<string, unknown>;
      };

      expect(where.triggerAt).toHaveProperty('lte');
      // gte definiria o piso da janela — é justamente o que não pode existir
      expect(where.triggerAt).not.toHaveProperty('gte');
    });

    it('encontra lembrete vencido há dias', async () => {
      const { prisma, findMany } = prismaEspiao();

      await new RemindersService(prisma).buscarPendentes();

      const where = argsDe(findMany).where as {
        triggerAt: { lte: Date };
      };
      const doisDiasAtras = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      // Só o teto é definido, então qualquer data anterior entra
      expect(doisDiasAtras.getTime()).toBeLessThan(
        where.triggerAt.lte.getTime(),
      );
    });

    it('ignora lembretes que já esgotaram as tentativas', async () => {
      const { prisma, findMany } = prismaEspiao();

      await new RemindersService(prisma).buscarPendentes();

      expect(argsDe(findMany).where.retryCount).toEqual({ lt: 3 });
    });

    it('busca sem filtro de escritório — o worker varre todos', async () => {
      const { prisma, findMany } = prismaEspiao();

      await new RemindersService(prisma).buscarPendentes();

      expect(argsDe(findMany).where).not.toHaveProperty('officeId');
    });
  });

  describe('reserva — a falha que duplicava o envio', () => {
    it('troca PENDING por PROCESSING de forma atômica', async () => {
      // A implementação anterior enviava primeiro e marcava depois. Uma queda
      // entre as duas operações reenviava a mensagem ao cliente.
      const { prisma, updateMany } = prismaEspiao({ updateManyCount: 1 });

      const reservou = await new RemindersService(prisma).reservar('id-1');

      expect(reservou).toBe(true);
      const args = argsDe(updateMany);
      expect(args.where.status).toBe('PENDING');
      expect(args.data.status).toBe('PROCESSING');
    });

    it('devolve false quando outro worker já reservou', async () => {
      // O where exige status PENDING; se outro já trocou, count vem 0
      const { prisma } = prismaEspiao({ updateManyCount: 0 });

      const reservou = await new RemindersService(prisma).reservar('id-1');

      expect(reservou).toBe(false);
    });
  });

  describe('conclusão — a falha do status que nunca virava SENT', () => {
    it('marca SENT e grava o horário de envio', async () => {
      // A implementação anterior parava em PROCESSING, e era impossível
      // distinguir o que foi entregue do que travou no meio
      const { prisma, update } = prismaEspiao();

      await new RemindersService(prisma).marcarEnviado('id-1');

      const args = argsDe(update);
      expect(args.data.status).toBe('SENT');
      expect(args.data.sentAt).toBeInstanceOf(Date);
    });
  });

  describe('falha e nova tentativa', () => {
    it('volta para PENDING enquanto houver tentativa', async () => {
      const { prisma, update } = prismaEspiao();

      await new RemindersService(prisma).marcarFalha('id-1', 0, 'timeout');

      const args = argsDe(update);
      expect(args.data.status).toBe('PENDING');
      expect(args.data.retryCount).toBe(1);
    });

    it('marca FAILED ao esgotar as três tentativas', async () => {
      const { prisma, update } = prismaEspiao();

      await new RemindersService(prisma).marcarFalha('id-1', 2, 'timeout');

      const args = argsDe(update);
      expect(args.data.status).toBe('FAILED');
      expect(args.data.retryCount).toBe(3);
    });

    it('trunca a mensagem de erro para não estourar a coluna', async () => {
      const { prisma, update } = prismaEspiao();

      await new RemindersService(prisma).marcarFalha(
        'id-1',
        0,
        'x'.repeat(900),
      );

      expect((argsDe(update).data.errorMessage as string).length).toBe(500);
    });
  });

  describe('listagem de falhados', () => {
    it('filtra pelo escritório', async () => {
      const { prisma, findMany } = prismaEspiao();

      await new RemindersService(prisma).listarFalhados('escritorio-1');

      const where = argsDe(findMany).where;
      expect(where.officeId).toBe('escritorio-1');
      expect(where.status).toBe('FAILED');
    });
  });
});

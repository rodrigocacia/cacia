import { describe, expect, it, vi } from 'vitest';
import { JuditWebhookService } from './judit-webhook.service';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { EventoJudit } from './judit-webhook.service';

/**
 * O sistema anterior chamava a consulta pontual da Judit no cadastro do
 * processo e nunca mais. Movimentações posteriores não chegavam: o produto
 * virava um cadastro de processos, quando deveria ser um acompanhamento.
 */

const PROCESSO = {
  id: 'proc-1',
  officeId: 'escritorio-1',
  number: '12345678901234567890',
  customerId: 'cliente-1',
};

function montar(
  opcoes: { processo?: typeof PROCESSO | null; criados?: number } = {},
) {
  const findFirst = vi
    .fn()
    .mockResolvedValue(
      opcoes.processo === undefined ? PROCESSO : opcoes.processo,
    );
  const createMany = vi.fn().mockResolvedValue({ count: opcoes.criados ?? 0 });
  const criarNotificacao = vi.fn().mockResolvedValue({});

  const prisma = {
    process: {
      findFirst,
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue({
        number: PROCESSO.number,
        customer: { name: 'Maria Silva' },
        office: { ownerId: 'dono-1' },
      }),
    },
    progress: { createMany },
    notification: { create: criarNotificacao },
  } as unknown as PrismaService;

  return {
    servico: new JuditWebhookService(prisma),
    findFirst,
    createMany,
    criarNotificacao,
    prisma,
  };
}

function evento(extra: Partial<EventoJudit> = {}): EventoJudit {
  return {
    tracking_id: 'trk-1',
    response_data: {
      name: 'Ação de cobrança',
      status: 'Em andamento',
      phase: 'Conhecimento',
      steps: [
        {
          step_id: 's1',
          content: 'Petição inicial protocolada',
          step_date: '2026-01-10',
        },
        { step_id: 's2', content: 'Citação expedida', step_date: '2026-01-20' },
      ],
    },
    ...extra,
  };
}

describe('JuditWebhookService', () => {
  describe('localização do processo', () => {
    it('prefere o tracking_id ao request_id', async () => {
      // O tracking_id é o vínculo permanente; o request_id pertence a uma
      // consulta específica e pode se repetir entre processos
      const { servico, findFirst } = montar();

      await servico.processar(evento({ request_id: 'req-1' }));

      const where = (
        findFirst.mock.calls[0]?.[0] as { where: Record<string, unknown> }
      ).where;
      expect(where.juditTrackingId).toBe('trk-1');
      expect(where.requestId).toBeUndefined();
    });

    it('usa o request_id quando não há tracking_id', async () => {
      const { servico, findFirst } = montar();

      await servico.processar({
        request_id: 'req-1',
        response_data: { steps: [] },
      });

      const where = (
        findFirst.mock.calls[0]?.[0] as { where: Record<string, unknown> }
      ).where;
      expect(where.requestId).toBe('req-1');
    });

    it('ignora evento sem processo correspondente', async () => {
      const { servico, createMany } = montar({ processo: null });

      await servico.processar(evento());

      expect(createMany).not.toHaveBeenCalled();
    });
  });

  describe('andamentos', () => {
    it('deixa a deduplicação para o banco', async () => {
      // O sistema anterior comparava em memória, o que deixava passar
      // duplicata quando dois eventos chegavam ao mesmo tempo
      const { servico, createMany } = montar({ criados: 2 });

      await servico.processar(evento());

      const args = createMany.mock.calls[0]?.[0] as { skipDuplicates: boolean };
      expect(args.skipDuplicates).toBe(true);
    });

    it('descarta andamento sem conteúdo', async () => {
      const { servico, createMany } = montar({ criados: 1 });

      await servico.processar(
        evento({
          response_data: {
            steps: [
              { step_id: 's1', content: 'Válido' },
              { step_id: 's2', content: '   ' },
              { step_id: 's3' },
            ],
          },
        }),
      );

      const args = createMany.mock.calls[0]?.[0] as { data: unknown[] };
      expect(args.data).toHaveLength(1);
    });

    it('não grava nada quando não há andamento válido', async () => {
      const { servico, createMany } = montar();

      await servico.processar(evento({ response_data: { steps: [] } }));

      expect(createMany).not.toHaveBeenCalled();
    });
  });

  describe('notificação', () => {
    it('avisa o dono do escritório quando há andamento novo', async () => {
      const { servico, criarNotificacao } = montar({ criados: 2 });

      await servico.processar(evento());

      expect(criarNotificacao).toHaveBeenCalledOnce();
      const args = criarNotificacao.mock.calls[0]?.[0] as {
        data: { typeDetail: string; userId: string };
      };
      expect(args.data.typeDetail).toContain('2');
      expect(args.data.userId).toBe('dono-1');
    });

    it('não notifica quando todos os andamentos já eram conhecidos', async () => {
      // createMany com skipDuplicates devolve count 0
      const { servico, criarNotificacao } = montar({ criados: 0 });

      await servico.processar(evento());

      expect(criarNotificacao).not.toHaveBeenCalled();
    });
  });

  describe('status vindo da Judit', () => {
    it('preserva o valor original em vez de encaixá-lo no enum', async () => {
      // A Judit devolve string livre; forçá-la no enum canônico quebraria a
      // gravação e perderia a informação
      const { servico, prisma } = montar({ criados: 0 });

      await servico.processar(evento());

      const args = (prisma.process.updateMany as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as { data: { juditStatus: string } };
      expect(args.data.juditStatus).toBe('Em andamento');
    });
  });

  describe('resiliência', () => {
    it('não propaga erro — a Judit reenviaria e duplicaria andamentos', async () => {
      const { servico, prisma } = montar();
      vi.spyOn(prisma.process, 'findFirst').mockRejectedValue(
        new Error('banco fora do ar'),
      );

      await expect(servico.processar(evento())).resolves.toBeUndefined();
    });
  });
});

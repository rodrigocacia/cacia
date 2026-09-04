import { describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';
import { MessageType, WhatsappProvider } from '@cacia/database';
import { EnvioWhatsappProcessor } from './envio-whatsapp.processor';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { WahaService } from '@/integrations/waha/waha.service';
import type { EvolutionService } from '@/integrations/evolution/evolution.service';
import type { JobEnvioWhatsapp } from '../filas/filas';

const CONEXAO_COMPLETA = {
  provider: WhatsappProvider.WAHA,
  fallbackEnabled: true,
  wahaSession: 'office-1',
  wahaApiHost: 'https://waha.local',
  wahaApiKey: 'chave-waha',
  evolutionApiHost: 'https://evolution.local',
  evolutionApiInstance: 'inst-1',
  evolutionApiKey: 'chave-evolution',
};

function montar(
  opcoes: {
    conexao?: Partial<typeof CONEXAO_COMPLETA> | null;
    wahaFalha?: boolean;
  } = {},
) {
  const conexao =
    opcoes.conexao === null ? null : { ...CONEXAO_COMPLETA, ...opcoes.conexao };

  const prisma = {
    connection: { findFirst: vi.fn().mockResolvedValue(conexao) },
    message: { updateMany: vi.fn() },
  } as unknown as PrismaService;

  const enviarTextoWaha = opcoes.wahaFalha
    ? vi.fn().mockRejectedValue(new Error('WAHA fora do ar'))
    : vi.fn().mockResolvedValue({ id: 'waha-1' });

  const waha = {
    enviarTexto: enviarTextoWaha,
    enviarArquivo: vi.fn(),
    enviarAudio: vi.fn(),
  } as unknown as WahaService;

  const enviarTextoEvolution = vi
    .fn()
    .mockResolvedValue({ key: { id: 'ev-1' } });
  const evolution = {
    enviarTexto: enviarTextoEvolution,
    enviarMidia: vi.fn(),
    enviarAudio: vi.fn(),
  } as unknown as EvolutionService;

  return {
    processador: new EnvioWhatsappProcessor(prisma, waha, evolution),
    enviarTextoWaha,
    enviarTextoEvolution,
    prisma,
  };
}

function job(dados: Partial<JobEnvioWhatsapp> = {}): Job<JobEnvioWhatsapp> {
  return {
    data: {
      officeId: 'escritorio-1',
      connectionId: 'conexao-1',
      para: '5511999998888',
      tipo: MessageType.TEXT,
      texto: 'Olá',
      ...dados,
    },
    attemptsMade: 3,
    opts: { attempts: 3 },
  } as Job<JobEnvioWhatsapp>;
}

describe('EnvioWhatsappProcessor', () => {
  describe('caminho normal', () => {
    it('envia pelo WAHA quando o provedor é WAHA', async () => {
      const { processador, enviarTextoWaha, enviarTextoEvolution } = montar();

      const r = await processador.process(job());

      expect(r.enviadoPor).toBe('waha');
      expect(enviarTextoWaha).toHaveBeenCalledOnce();
      expect(enviarTextoEvolution).not.toHaveBeenCalled();
    });
  });

  describe('fallback para a Evolution', () => {
    it('cai para a Evolution quando o WAHA falha', async () => {
      // O WAHA é single-node: sem fallback, uma indisponibilidade dele pararia
      // o atendimento inteiro do escritório
      const { processador, enviarTextoEvolution } = montar({ wahaFalha: true });

      const r = await processador.process(job());

      expect(r.enviadoPor).toBe('evolution');
      expect(enviarTextoEvolution).toHaveBeenCalledOnce();
    });

    it('propaga o erro quando o fallback está desligado', async () => {
      const { processador, enviarTextoEvolution } = montar({
        wahaFalha: true,
        conexao: { fallbackEnabled: false },
      });

      await expect(processador.process(job())).rejects.toThrow(
        'WAHA fora do ar',
      );
      expect(enviarTextoEvolution).not.toHaveBeenCalled();
    });

    it('propaga o erro quando faltam credenciais da Evolution', async () => {
      const { processador, enviarTextoEvolution } = montar({
        wahaFalha: true,
        conexao: { evolutionApiKey: null },
      });

      await expect(processador.process(job())).rejects.toThrow(
        'WAHA fora do ar',
      );
      expect(enviarTextoEvolution).not.toHaveBeenCalled();
    });
  });

  describe('validações', () => {
    it('falha quando a conexão não existe no escritório', async () => {
      const { processador } = montar({ conexao: null });

      await expect(processador.process(job())).rejects.toThrow(
        'não encontrada',
      );
    });

    it('busca a conexão filtrando pelo escritório', async () => {
      const { processador, prisma } = montar();

      await processador.process(job());

      const where = (
        (prisma.connection.findFirst as ReturnType<typeof vi.fn>).mock
          .calls[0]?.[0] as { where: Record<string, unknown> }
      ).where;
      expect(where.officeId).toBe('escritorio-1');
    });

    it('recusa envio de mídia sem arquivo', async () => {
      const { processador } = montar();

      await expect(
        processador.process(
          job({ tipo: MessageType.IMAGE, arquivo: undefined }),
        ),
      ).rejects.toThrow('sem arquivo');
    });
  });

  describe('falha definitiva', () => {
    it('marca a mensagem como FAILED ao esgotar as tentativas', async () => {
      // Sem isso a mensagem ficaria em PENDING e o atendente acharia que
      // ela tinha sido enviada
      const { processador, prisma } = montar();

      await processador.onFailed(job({ chatId: 'chat-1' }));

      const args = (prisma.message.updateMany as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as { data: { status: string } };
      expect(args.data.status).toBe('FAILED');
    });

    it('não marca nada enquanto ainda houver tentativa', async () => {
      const { processador, prisma } = montar();
      const jobParcial = {
        ...job({ chatId: 'chat-1' }),
        attemptsMade: 1,
      } as Job<JobEnvioWhatsapp>;

      await processador.onFailed(jobParcial);

      expect(prisma.message.updateMany).not.toHaveBeenCalled();
    });
  });
});

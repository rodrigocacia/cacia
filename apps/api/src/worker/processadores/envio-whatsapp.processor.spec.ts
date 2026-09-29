import { describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';
import { MessageType, WhatsappProvider } from '@cacia/database';
import { EnvioWhatsappProcessor } from './envio-whatsapp.processor';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { WahaService } from '@/integrations/waha/waha.service';
import type { EvolutionService } from '@/integrations/evolution/evolution.service';
import type { StorageService } from '@/infra/storage/storage.service';
import type { JobEnvioWhatsapp } from '../filas/filas';

/**
 * Espelha as colunas da tabela, com os mesmos campos nuláveis.
 *
 * O tipo importa: é justamente o caso "credencial ausente" que os testes
 * abaixo exercitam, e sem `| null` na declaração o teste não compilaria.
 */
const CONEXAO_COMPLETA: {
  provider: WhatsappProvider;
  fallbackEnabled: boolean;
  wahaSession: string | null;
  wahaApiHost: string | null;
  wahaApiKey: string | null;
  evolutionApiHost: string | null;
  evolutionApiInstance: string | null;
  evolutionApiKey: string | null;
} = {
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

  const storage = {
    gerarLinkTemporario: vi.fn().mockResolvedValue('https://storage/assinado'),
  } as unknown as StorageService;

  return {
    storage,
    processador: new EnvioWhatsappProcessor(prisma, waha, evolution, storage),
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

  describe('estado da mensagem', () => {
    it('marca como SENT e grava o id que o WhatsApp devolveu', async () => {
      // O id é o que liga os avisos de entrega e leitura a esta mensagem
      const { processador, prisma, enviarTextoWaha } = montar();
      enviarTextoWaha.mockResolvedValueOnce({
        id: 'true_5511999998888@c.us_3EB0XYZ',
      });

      await processador.process(job({ messageId: 'mensagem-1' }));

      const chamadas = (prisma.message.updateMany as ReturnType<typeof vi.fn>)
        .mock.calls;
      expect(chamadas[0]?.[0]).toMatchObject({
        where: { id: 'mensagem-1', officeId: 'escritorio-1' },
        data: { status: 'SENT' },
      });
      expect(chamadas[1]?.[0]).toMatchObject({
        data: { externalId: '3EB0XYZ' },
      });
    });

    it('arquivo do storage sai com link gerado na hora do envio', async () => {
      // Gerado ao enfileirar, o link venceria antes de uma nova tentativa
      const { processador, storage } = montar();
      const enviarArquivo = vi.fn().mockResolvedValue({ id: 'x' });
      Object.assign((processador as unknown as { waha: object }).waha, {
        enviarArquivo,
      });

      await processador.process(
        job({
          tipo: MessageType.DOCUMENT,
          texto: undefined,
          arquivo: {
            chave: 'escritorio-1/a.pdf',
            mimetype: 'application/pdf',
            filename: 'contrato.pdf',
          },
        }),
      );

      expect(storage.gerarLinkTemporario).toHaveBeenCalledWith(
        'escritorio-1/a.pdf',
      );
      expect(enviarArquivo.mock.calls[0]?.[2]).toEqual({
        url: 'https://storage/assinado',
        mimetype: 'application/pdf',
        filename: 'contrato.pdf',
      });
    });

    it('sem messageId não mexe em mensagem nenhuma', async () => {
      // Lembretes não têm mensagem gravada na conversa
      const { processador, prisma } = montar();

      await processador.process(job());

      expect(prisma.message.updateMany).not.toHaveBeenCalled();
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

    it('com messageId, marca só aquela mensagem', async () => {
      // Sem o recorte, a falha de uma resposta do advogado marcaria como
      // falha também a resposta da IA que ainda estava saindo.
      const { processador, prisma } = montar();

      await processador.onFailed(
        job({ chatId: 'chat-1', messageId: 'mensagem-1' }),
      );

      const args = (prisma.message.updateMany as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as { where: { id?: string } };
      expect(args.where.id).toBe('mensagem-1');
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

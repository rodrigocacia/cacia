import { describe, expect, it, vi } from 'vitest';
import { WahaWebhookService } from './waha-webhook.service';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { WahaService } from '@/integrations/waha/waha.service';
import type { ChatsService } from '@/modules/chats/chats.service';
import type { EventoWahaDto } from './dto/waha-webhook.dto';

const ESCRITORIO = 'aaaaaaaa-0000-0000-0000-000000000001';

const CONEXAO = { wahaApiHost: 'https://waha.local', wahaApiKey: 'chave' };

function montar(
  opcoes: {
    clienteExistente?: { id: string } | null;
    leadExistente?: { id: string } | null;
    lidResolvido?: string | null;
  } = {},
) {
  const criarLead = vi.fn().mockResolvedValue({ id: 'lead-novo' });

  const prisma = {
    connection: {
      findFirst: vi.fn().mockResolvedValue(CONEXAO),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    customer: {
      findFirst: vi.fn().mockResolvedValue(opcoes.clienteExistente ?? null),
    },
    lead: {
      findFirst: vi.fn().mockResolvedValue(opcoes.leadExistente ?? null),
      create: criarLead,
    },
  } as unknown as PrismaService;

  const resolverLid = vi
    .fn()
    .mockResolvedValue(opcoes.lidResolvido ?? '5511999998888');
  const waha = { resolverLid } as unknown as WahaService;

  const encontrarOuCriar = vi.fn().mockResolvedValue({ id: 'chat-1' });
  const registrarMensagem = vi.fn().mockResolvedValue({ id: 'msg-1' });
  const chats = {
    encontrarOuCriar,
    registrarMensagem,
  } as unknown as ChatsService;

  return {
    servico: new WahaWebhookService(prisma, waha, chats),
    prisma,
    resolverLid,
    criarLead,
    encontrarOuCriar,
    registrarMensagem,
  };
}

function mensagem(extra: Record<string, unknown> = {}): EventoWahaDto {
  return {
    event: 'message',
    session: 'office-1',
    payload: {
      id: 'msg-waha-1',
      timestamp: Date.now(),
      from: '5511999998888@c.us',
      fromMe: false,
      body: 'Preciso de ajuda com um processo',
      ...extra,
    },
  };
}

describe('WahaWebhookService', () => {
  describe('mensagens ignoradas', () => {
    it('ignora mensagem enviada pelo próprio bot', async () => {
      // Sem isso, tudo que o sistema manda volta e é gravado duas vezes
      const { servico, registrarMensagem } = montar();

      await servico.processar(ESCRITORIO, mensagem({ fromMe: true }));

      expect(registrarMensagem).not.toHaveBeenCalled();
    });

    it('ignora mensagem sem texto e sem mídia', async () => {
      const { servico, registrarMensagem } = montar();

      await servico.processar(
        ESCRITORIO,
        mensagem({ body: undefined, hasMedia: false }),
      );

      expect(registrarMensagem).not.toHaveBeenCalled();
    });

    it('ignora mensagem de grupo', async () => {
      // Um grupo criaria um lead com o identificador do grupo, não de uma pessoa
      const { servico, registrarMensagem } = montar();

      await servico.processar(
        ESCRITORIO,
        mensagem({ from: '120363000000@g.us' }),
      );

      expect(registrarMensagem).not.toHaveBeenCalled();
    });

    it('ignora evento de tipo desconhecido', async () => {
      const { servico, registrarMensagem } = montar();

      await servico.processar(ESCRITORIO, {
        event: 'presence.update',
        session: 'office-1',
      });

      expect(registrarMensagem).not.toHaveBeenCalled();
    });
  });

  describe('resolução de @lid', () => {
    it('traduz @lid para telefone antes de identificar o contato', async () => {
      // O motor GOWS recusa enviar para um @lid; gravar o lead com ele
      // quebraria a resposta ao cliente
      const { servico, resolverLid, criarLead } = montar({
        lidResolvido: '5511977776666',
      });

      await servico.processar(ESCRITORIO, mensagem({ from: '123456789@lid' }));

      expect(resolverLid).toHaveBeenCalled();
      const dados = criarLead.mock.calls[0]?.[0] as {
        data: { remotejid: string };
      };
      expect(dados.data.remotejid).toBe('5511977776666');
    });

    it('não chama a resolução quando já é telefone', async () => {
      const { servico, resolverLid } = montar();

      await servico.processar(ESCRITORIO, mensagem());

      expect(resolverLid).not.toHaveBeenCalled();
    });
  });

  describe('identificação do contato', () => {
    it('cria lead quando o número é desconhecido', async () => {
      const { servico, criarLead, registrarMensagem } = montar();

      await servico.processar(ESCRITORIO, mensagem());

      expect(criarLead).toHaveBeenCalledOnce();
      const args = registrarMensagem.mock.calls[0]?.[0] as {
        leadId?: string;
        remetente: string;
      };
      expect(args.leadId).toBe('lead-novo');
      expect(args.remetente).toBe('LEAD');
    });

    it('cliente tem prioridade sobre lead', async () => {
      // Quem já é cliente não deve virar lead de novo ao mandar mensagem
      const { servico, criarLead, registrarMensagem } = montar({
        clienteExistente: { id: 'cliente-1' },
        leadExistente: { id: 'lead-antigo' },
      });

      await servico.processar(ESCRITORIO, mensagem());

      expect(criarLead).not.toHaveBeenCalled();
      const args = registrarMensagem.mock.calls[0]?.[0] as {
        customerId?: string;
        remetente: string;
      };
      expect(args.customerId).toBe('cliente-1');
      expect(args.remetente).toBe('CUSTOMER');
    });

    it('reaproveita lead já existente', async () => {
      const { servico, criarLead, registrarMensagem } = montar({
        leadExistente: { id: 'lead-antigo' },
      });

      await servico.processar(ESCRITORIO, mensagem());

      expect(criarLead).not.toHaveBeenCalled();
      const args = registrarMensagem.mock.calls[0]?.[0] as { leadId?: string };
      expect(args.leadId).toBe('lead-antigo');
    });
  });

  describe('classificação de mídia', () => {
    const casos = [
      { mimetype: 'image/jpeg', esperado: 'IMAGE' },
      { mimetype: 'video/mp4', esperado: 'VIDEO' },
      { mimetype: 'audio/ogg', esperado: 'AUDIO' },
      { mimetype: 'application/pdf', esperado: 'DOCUMENT' },
    ];

    for (const caso of casos) {
      it(`classifica ${caso.mimetype} como ${caso.esperado}`, async () => {
        const { servico, registrarMensagem } = montar();

        await servico.processar(
          ESCRITORIO,
          mensagem({
            hasMedia: true,
            media: { url: 'https://x/y', mimetype: caso.mimetype },
          }),
        );

        const args = registrarMensagem.mock.calls[0]?.[0] as { tipo: string };
        expect(args.tipo).toBe(caso.esperado);
      });
    }
  });

  describe('resiliência', () => {
    it('não propaga erro — o WAHA reenviaria e duplicaria a mensagem', async () => {
      const { servico, prisma } = montar();
      vi.spyOn(prisma.customer, 'findFirst').mockRejectedValue(
        new Error('banco fora do ar'),
      );

      await expect(
        servico.processar(ESCRITORIO, mensagem()),
      ).resolves.toBeUndefined();
    });
  });
});

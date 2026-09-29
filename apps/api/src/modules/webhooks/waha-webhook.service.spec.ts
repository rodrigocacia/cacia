import { describe, expect, it, vi } from 'vitest';
import type { Queue } from 'bullmq';
import { ChatStatus } from '@cacia/database';
import type { PipelinesService } from '@/modules/pipelines/pipelines.service';
import { WahaWebhookService } from './waha-webhook.service';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { StorageService } from '@/infra/storage/storage.service';
import type { WahaService } from '@/integrations/waha/waha.service';
import type { ChatsService } from '@/modules/chats/chats.service';
import type { JobAtendimento } from '@/worker/filas/filas';
import type { EventoWahaDto } from './dto/waha-webhook.dto';

const ESCRITORIO = 'aaaaaaaa-0000-0000-0000-000000000001';

const CONEXAO = {
  id: 'conexao-1',
  wahaApiHost: 'https://waha.local',
  wahaApiKey: 'chave',
};

function montar(
  opcoes: {
    clienteExistente?: { id: string } | null;
    leadExistente?: { id: string } | null;
    lidResolvido?: string | null;
    statusDaConversa?: ChatStatus;
    /** Resultado de message.findFirst: mensagem já gravada ou eco. */
    mensagemExistente?: { id: string } | null;
  } = {},
) {
  const criarLead = vi.fn().mockResolvedValue({ id: 'lead-novo' });
  const registrarEtapa = vi.fn().mockResolvedValue({ id: 'passagem-1' });

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
      update: vi.fn().mockResolvedValue({ id: 'lead-restaurado' }),
    },
    leadStageHistory: { create: registrarEtapa },
    message: {
      findFirst: vi.fn().mockResolvedValue(opcoes.mensagemExistente ?? null),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    chat: { update: vi.fn() },
  } as unknown as PrismaService;

  const resolverLid = vi
    .fn()
    .mockResolvedValue(opcoes.lidResolvido ?? '5511999998888');
  const baixarMidia = vi.fn().mockResolvedValue(Buffer.from('arquivo'));
  const waha = { resolverLid, baixarMidia } as unknown as WahaService;

  const storage = {
    enviar: vi.fn().mockResolvedValue({
      chave: `${ESCRITORIO}/midia.ogg`,
      url: `${ESCRITORIO}/midia.ogg`,
      tamanhoBytes: 7,
    }),
  } as unknown as StorageService;

  const encontrarOuCriar = vi.fn().mockResolvedValue({
    id: 'chat-1',
    agentId: 'agente-1',
    status: opcoes.statusDaConversa ?? ChatStatus.ACTIVE,
  });
  const registrarMensagem = vi.fn().mockResolvedValue({ id: 'msg-1' });
  const chats = {
    encontrarOuCriar,
    registrarMensagem,
  } as unknown as ChatsService;

  const enfileirar = vi.fn().mockResolvedValue({ id: 'job-1' });
  const atendimento = { add: enfileirar } as unknown as Queue<JobAtendimento>;

  // O lead criado aqui nasce numa etapa do funil padrão — sem isso ficaria
  // fora do quadro, invisível para quem trabalha o funil.
  const etapaInicial = vi.fn().mockResolvedValue({
    pipelineId: 'funil-1',
    stageId: 'etapa-1',
    position: 0,
    kind: 'OPEN',
  });
  const pipelines = { etapaInicial } as unknown as PipelinesService;

  return {
    servico: new WahaWebhookService(
      prisma,
      waha,
      chats,
      pipelines,
      storage,
      atendimento,
    ),
    prisma,
    storage,
    baixarMidia,
    resolverLid,
    criarLead,
    registrarEtapa,
    etapaInicial,
    encontrarOuCriar,
    registrarMensagem,
    enfileirar,
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
  describe('mensagens que saem do número do escritório', () => {
    function doCelular(extra: Record<string, unknown> = {}) {
      return {
        ...mensagem({
          fromMe: true,
          from: '5511000000000@c.us',
          to: '5511999998888@c.us',
          body: 'Oi, aqui é a Dra. Helena pelo celular',
          ...extra,
        }),
        event: 'message.any',
      };
    }

    it('o eco do que o sistema enviou não é gravado de novo', async () => {
      // Sem isso, tudo que a IA e a tela mandam apareceria duas vezes
      const { servico, registrarMensagem, prisma } = montar({
        leadExistente: { id: 'lead-1' },
      });
      vi.mocked(prisma.message.findFirst)
        .mockResolvedValueOnce(null) // não há mensagem com este id
        .mockResolvedValueOnce({ id: 'enviada-pela-tela' } as never); // eco

      await servico.processar(ESCRITORIO, doCelular());

      expect(registrarMensagem).not.toHaveBeenCalled();
      // O id fica gravado para os avisos de entrega
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: 'enviada-pela-tela' },
        data: { externalId: 'msg-waha-1' },
      });
    });

    it('o que o advogado digita no celular entra na conversa', async () => {
      const { servico, registrarMensagem, prisma, enfileirar } = montar({
        leadExistente: { id: 'lead-1' },
      });

      await servico.processar(ESCRITORIO, doCelular());

      const args = registrarMensagem.mock.calls[0]?.[0] as {
        remetente: string;
        texto: string;
        status: string;
        leadId: string;
      };
      expect(args).toMatchObject({
        remetente: 'USER',
        texto: 'Oi, aqui é a Dra. Helena pelo celular',
        status: 'SENT',
        leadId: 'lead-1',
      });
      // Respondeu pelo celular, assumiu: a IA para
      expect(prisma.chat.update).toHaveBeenCalledWith({
        where: { id: 'chat-1' },
        data: { status: ChatStatus.PENDING },
      });
      expect(enfileirar).not.toHaveBeenCalled();
    });

    it('conversa com quem não é lead nem cliente é ignorada', async () => {
      // O número do escritório também fala com fornecedor, colega, família
      const { servico, registrarMensagem, criarLead } = montar();

      await servico.processar(ESCRITORIO, doCelular());

      expect(registrarMensagem).not.toHaveBeenCalled();
      expect(criarLead).not.toHaveBeenCalled();
    });
  });

  describe('entrega e leitura', () => {
    function ack(valor: number) {
      return {
        event: 'message.ack',
        session: 'office-1',
        payload: {
          id: 'true_5511999998888@c.us_3EB0XYZ',
          timestamp: Date.now(),
          from: '5511000000000@c.us',
          fromMe: true,
          ack: valor,
        },
      };
    }

    it('entregue só avança a partir de estados anteriores', async () => {
      // Um "entregue" atrasado não pode apagar o visto azul
      const { servico, prisma } = montar();

      await servico.processar(ESCRITORIO, ack(2));

      expect(prisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          officeId: ESCRITORIO,
          externalId: '3EB0XYZ',
          status: { in: ['PENDING', 'FAILED', 'SENT'] },
        },
        data: { status: 'DELIVERED' },
      });
    });

    it('lida e ouvida viram READ', async () => {
      const { servico, prisma } = montar();

      await servico.processar(ESCRITORIO, ack(4));

      const args = vi.mocked(prisma.message.updateMany).mock.calls[0]?.[0] as {
        data: { status: string };
      };
      expect(args.data.status).toBe('READ');
    });

    it('erro de entrega marca como falha', async () => {
      const { servico, prisma } = montar();

      await servico.processar(ESCRITORIO, ack(-1));

      const args = vi.mocked(prisma.message.updateMany).mock.calls[0]?.[0] as {
        data: { status: string };
      };
      expect(args.data.status).toBe('FAILED');
    });
  });

  describe('mensagens ignoradas', () => {
    it('ignora mensagem já gravada (reentrega do WAHA)', async () => {
      const { servico, registrarMensagem } = montar({
        mensagemExistente: { id: 'ja-gravada' },
      });

      await servico.processar(ESCRITORIO, mensagem());

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
      // Gravado no mesmo formato da tela, para não duplicar o contato
      expect(dados.data.remotejid).toBe('5511977776666@c.us');
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

    it('copia a mídia para o storage, onde a tela consegue abrir', async () => {
      // O link do evento aponta para o WAHA, exige a chave e expira
      const { servico, registrarMensagem, baixarMidia, storage } = montar();

      await servico.processar(
        ESCRITORIO,
        mensagem({
          hasMedia: true,
          body: '',
          media: { url: 'https://waha/files/a.oga', mimetype: 'audio/ogg' },
        }),
      );

      expect(baixarMidia).toHaveBeenCalledWith(
        'https://waha/files/a.oga',
        expect.objectContaining({ apiKey: 'chave' }),
      );
      expect(storage.enviar).toHaveBeenCalled();
      const args = registrarMensagem.mock.calls[0]?.[0] as {
        arquivoUrl: string;
      };
      expect(args.arquivoUrl).toBe(`${ESCRITORIO}/midia.ogg`);
    });

    it('falha ao copiar a mídia não perde a mensagem', async () => {
      const { servico, registrarMensagem, baixarMidia } = montar();
      baixarMidia.mockRejectedValueOnce(new Error('WAHA fora'));

      await servico.processar(
        ESCRITORIO,
        mensagem({
          hasMedia: true,
          media: {
            url: 'https://waha/files/a.pdf',
            mimetype: 'application/pdf',
          },
        }),
      );

      expect(registrarMensagem).toHaveBeenCalledOnce();
    });
  });

  describe('pedido de resposta ao agente', () => {
    it('enfileira depois de gravar a mensagem', async () => {
      // A ordem importa: o worker vai ao banco ler o que a pessoa escreveu. Se
      // o job saísse antes da gravação, o agente responderia sem enxergá-la.
      const { servico, registrarMensagem, enfileirar } = montar();

      await servico.processar(ESCRITORIO, mensagem());

      expect(registrarMensagem).toHaveBeenCalledOnce();
      expect(enfileirar).toHaveBeenCalledOnce();
      expect(registrarMensagem.mock.invocationCallOrder[0]!).toBeLessThan(
        enfileirar.mock.invocationCallOrder[0]!,
      );
    });

    it('o job leva a conexão e o destinatário já resolvido', async () => {
      // A resposta precisa sair pela MESMA sessão por onde a mensagem entrou:
      // um escritório com duas conexões responderia pelo número errado.
      const { servico, enfileirar } = montar();

      await servico.processar(ESCRITORIO, mensagem());

      expect(enfileirar.mock.calls[0]?.[1]).toEqual({
        officeId: ESCRITORIO,
        chatId: 'chat-1',
        connectionId: 'conexao-1',
        para: '5511999998888',
      });
    });

    it('o destinatário do job é o telefone, nunca o @lid', async () => {
      const { servico, enfileirar } = montar({ lidResolvido: '5511777776666' });

      await servico.processar(ESCRITORIO, mensagem({ from: '123456789@lid' }));

      const job = enfileirar.mock.calls[0]?.[1] as { para: string };
      expect(job.para).toBe('5511777776666');
    });

    it('NÃO enfileira quando a conversa está com atendente humano', async () => {
      // É o pior comportamento possível do sistema: o agente respondendo por
      // cima de uma pessoa que assumiu o atendimento.
      const { servico, registrarMensagem, enfileirar } = montar({
        statusDaConversa: ChatStatus.PENDING,
      });

      await servico.processar(ESCRITORIO, mensagem());

      // A mensagem é gravada mesmo assim — o atendente precisa vê-la
      expect(registrarMensagem).toHaveBeenCalledOnce();
      expect(enfileirar).not.toHaveBeenCalled();
    });

    it('NÃO enfileira em conversa encerrada', async () => {
      const { servico, enfileirar } = montar({
        statusDaConversa: ChatStatus.COMPLETED,
      });

      await servico.processar(ESCRITORIO, mensagem());

      expect(enfileirar).not.toHaveBeenCalled();
    });

    it('falha ao enfileirar não perde a mensagem', async () => {
      // Perder a resposta automática é ruim; perder a mensagem do cliente
      // seria muito pior. A gravação já aconteceu antes.
      const { servico, registrarMensagem, enfileirar } = montar();
      enfileirar.mockRejectedValueOnce(new Error('Redis fora do ar'));

      await expect(
        servico.processar(ESCRITORIO, mensagem()),
      ).resolves.toBeUndefined();

      expect(registrarMensagem).toHaveBeenCalledOnce();
    });
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

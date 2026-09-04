import { describe, expect, it, vi } from 'vitest';
import type { Job, Queue } from 'bullmq';
import { ChatStatus, MessageSender, MessageType } from '@cacia/database';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { RedisService } from '@/infra/redis/redis.service';
import type { ChatsService } from '@/modules/chats/chats.service';
import type { AgenteService } from '@/ai/agente/agente.service';
import type { SumarizacaoService } from '@/ai/memoria/sumarizacao.service';
import type { ExtracaoDeFatosService } from '@/ai/memoria/extracao-de-fatos.service';
import { AtendimentoProcessor } from './atendimento.processor';
import type { JobAtendimento, JobEnvioWhatsapp } from '../filas/filas';

const DADOS: JobAtendimento = {
  officeId: 'escritorio-1',
  chatId: 'conversa-1',
  connectionId: 'conexao-1',
  para: '5511999998888',
};

interface MensagemGravada {
  messageText: string | null;
  messageCaption: string | null;
  type: MessageType;
}

function texto(conteudo: string): MensagemGravada {
  return {
    messageText: conteudo,
    messageCaption: null,
    type: MessageType.TEXT,
  };
}

function montar(
  opcoes: {
    chat?: {
      status: ChatStatus;
      customerId: string | null;
      leadId: string | null;
    } | null;
    /** Pendentes por chamada — a segunda simula o que chegou durante a resposta. */
    pendentes?: MensagemGravada[][];
    travaLivre?: boolean;
    respostaDoAgente?: string;
    extracaoFalha?: boolean;
  } = {},
) {
  const filas = opcoes.pendentes ?? [[texto('Como está meu processo?')], []];
  let chamada = 0;

  const mensagemFindMany = vi.fn().mockImplementation(() => {
    const atual = filas[chamada] ?? [];
    chamada++;
    return Promise.resolve(atual);
  });

  const prisma = {
    chat: {
      findFirst: vi.fn().mockResolvedValue(
        opcoes.chat === undefined
          ? {
              status: ChatStatus.ACTIVE,
              customerId: 'cliente-1',
              leadId: null,
            }
          : opcoes.chat,
      ),
    },
    message: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: mensagemFindMany,
    },
  } as unknown as PrismaService;

  const set = vi
    .fn()
    .mockResolvedValue(opcoes.travaLivre === false ? null : 'OK');
  const del = vi.fn().mockResolvedValue(1);
  const redis = { client: { set, del } } as unknown as RedisService;

  const registrarMensagem = vi.fn().mockResolvedValue({ id: 'msg-agente' });
  const chats = { registrarMensagem } as unknown as ChatsService;

  const responder = vi.fn().mockResolvedValue({
    texto: opcoes.respostaDoAgente ?? 'Seu processo está ativo.',
    ferramentasUsadas: ['consultar_processos'],
    acionouAtendente: false,
  });
  const agente = { responder } as unknown as AgenteService;

  const extrairDoTurno = opcoes.extracaoFalha
    ? vi.fn().mockRejectedValue(new Error('OpenAI fora do ar'))
    : vi.fn().mockResolvedValue(1);
  const extracao = { extrairDoTurno } as unknown as ExtracaoDeFatosService;

  const atualizarSeNecessario = vi.fn().mockResolvedValue(false);
  const sumarizacao = {
    atualizarSeNecessario,
  } as unknown as SumarizacaoService;

  const enfileirarAtendimento = vi.fn().mockResolvedValue({ id: 'job' });
  const enfileirarEnvio = vi.fn().mockResolvedValue({ id: 'job' });

  return {
    processador: new AtendimentoProcessor(
      prisma,
      redis,
      chats,
      agente,
      sumarizacao,
      extracao,
      { add: enfileirarAtendimento } as unknown as Queue<JobAtendimento>,
      { add: enfileirarEnvio } as unknown as Queue<JobEnvioWhatsapp>,
    ),
    responder,
    registrarMensagem,
    enfileirarEnvio,
    enfileirarAtendimento,
    extrairDoTurno,
    atualizarSeNecessario,
    set,
    del,
  };
}

function job(): Job<JobAtendimento> {
  return { data: DADOS } as Job<JobAtendimento>;
}

describe('AtendimentoProcessor', () => {
  describe('caminho feliz', () => {
    it('responde, grava e envia', async () => {
      const { processador, responder, registrarMensagem, enfileirarEnvio } =
        montar();

      const resultado = await processador.process(job());

      expect(resultado.respondeu).toBe(true);
      expect(responder).toHaveBeenCalledOnce();

      expect(registrarMensagem.mock.calls[0]?.[0]).toMatchObject({
        chatId: 'conversa-1',
        remetente: MessageSender.AGENT,
        texto: 'Seu processo está ativo.',
      });

      expect(enfileirarEnvio.mock.calls[0]?.[1]).toMatchObject({
        connectionId: 'conexao-1',
        para: '5511999998888',
        texto: 'Seu processo está ativo.',
      });
    });

    it('grava antes de enviar', async () => {
      // Se o envio viesse primeiro e a gravação falhasse, o cliente teria uma
      // resposta que não existe no histórico — e o atendente não saberia dela.
      const { processador, registrarMensagem, enfileirarEnvio } = montar();

      await processador.process(job());

      expect(registrarMensagem.mock.invocationCallOrder[0]!).toBeLessThan(
        enfileirarEnvio.mock.invocationCallOrder[0]!,
      );
    });

    it('leva o cliente e o lead da conversa ao agente', async () => {
      const { processador, responder } = montar({
        chat: {
          status: ChatStatus.ACTIVE,
          customerId: null,
          leadId: 'lead-9',
        },
      });

      await processador.process(job());

      expect(responder.mock.calls[0]?.[0]).toMatchObject({
        officeId: 'escritorio-1',
        chatId: 'conversa-1',
        leadId: 'lead-9',
        customerId: undefined,
      });
    });
  });

  describe('mensagens seguidas viram um turno só', () => {
    it('junta tudo o que chegou desde a última resposta', async () => {
      // Sem isso o agente responderia "oi" antes de ler a pergunta que veio
      // logo em seguida — e o cliente receberia duas respostas desconexas.
      const { processador, responder } = montar({
        pendentes: [
          [texto('oi'), texto('tenho uma dúvida'), texto('sobre meu processo')],
          [],
        ],
      });

      await processador.process(job());

      expect(responder.mock.calls[0]?.[0]).toMatchObject({
        mensagem: 'oi\ntenho uma dúvida\nsobre meu processo',
      });
    });

    it('mídia sem legenda é anunciada ao agente', async () => {
      // O modelo não lê a imagem, mas precisa saber que ela chegou. Ignorar
      // faria a resposta passar por cima de um documento recém-enviado.
      const { processador, responder } = montar({
        pendentes: [
          [
            {
              messageText: null,
              messageCaption: null,
              type: MessageType.DOCUMENT,
            },
          ],
          [],
        ],
      });

      await processador.process(job());

      expect(responder.mock.calls[0]?.[0]).toMatchObject({
        mensagem: '[a pessoa enviou um documento]',
      });
    });

    it('não responde quando outro job já respondeu tudo', async () => {
      const { processador, responder } = montar({ pendentes: [[], []] });

      const resultado = await processador.process(job());

      expect(resultado).toEqual({
        respondeu: false,
        motivo: 'nada pendente',
      });
      expect(responder).not.toHaveBeenCalled();
    });
  });

  describe('atendimento humano', () => {
    it('não responde por cima de quem assumiu a conversa', async () => {
      // A conversa sai de ACTIVE quando o agente aciona uma pessoa. Responder
      // aqui seria o pior comportamento possível do sistema.
      const { processador, responder, enfileirarEnvio } = montar({
        chat: {
          status: ChatStatus.PENDING,
          customerId: 'cliente-1',
          leadId: null,
        },
      });

      const resultado = await processador.process(job());

      expect(resultado.respondeu).toBe(false);
      expect(responder).not.toHaveBeenCalled();
      expect(enfileirarEnvio).not.toHaveBeenCalled();
    });

    it('nem em conversa encerrada', async () => {
      const { processador, responder } = montar({
        chat: {
          status: ChatStatus.COMPLETED,
          customerId: 'cliente-1',
          leadId: null,
        },
      });

      await processador.process(job());

      expect(responder).not.toHaveBeenCalled();
    });

    it('conversa inexistente não derruba o worker', async () => {
      const { processador } = montar({ chat: null });

      const resultado = await processador.process(job());

      expect(resultado.respondeu).toBe(false);
    });
  });

  describe('uma resposta por vez', () => {
    it('desiste quando outro job já está respondendo', async () => {
      // Três mensagens seguidas geram três jobs. Sem a trava, o cliente
      // receberia três respostas, e nenhuma teria visto as outras.
      const { processador, responder } = montar({ travaLivre: false });

      const resultado = await processador.process(job());

      expect(resultado).toEqual({
        respondeu: false,
        motivo: 'resposta em andamento',
      });
      expect(responder).not.toHaveBeenCalled();
    });

    it('a trava é por conversa e expira sozinha', async () => {
      const { processador, set } = montar();

      await processador.process(job());

      expect(set).toHaveBeenCalledWith(
        'atendimento:travado:conversa-1',
        '1',
        'EX',
        expect.any(Number),
        'NX',
      );
    });

    it('libera a trava mesmo quando o agente falha', async () => {
      // Sem isso, um erro do modelo deixaria a conversa muda até a trava
      // expirar — e ninguém saberia por quê.
      const { processador, responder, del } = montar();
      responder.mockRejectedValueOnce(new Error('modelo indisponível'));

      await expect(processador.process(job())).rejects.toThrow(
        'modelo indisponível',
      );

      expect(del).toHaveBeenCalledWith('atendimento:travado:conversa-1');
    });
  });

  describe('mensagem que chega durante a resposta', () => {
    it('é reenfileirada em vez de ficar sem resposta', async () => {
      // O job dela foi recusado pela trava. Este reenfileiramento é o que
      // impede que ela fique esperando a pessoa escrever de novo.
      const { processador, enfileirarAtendimento } = montar({
        pendentes: [[texto('primeira')], [texto('chegou durante a resposta')]],
      });

      await processador.process(job());

      expect(enfileirarAtendimento).toHaveBeenCalledOnce();
      expect(enfileirarAtendimento.mock.calls[0]?.[1]).toEqual(DADOS);
    });

    it('não reenfileira quando não chegou nada', async () => {
      const { processador, enfileirarAtendimento } = montar();

      await processador.process(job());

      expect(enfileirarAtendimento).not.toHaveBeenCalled();
    });
  });

  describe('consolidação da memória', () => {
    it('extrai fatos e atualiza o resumo depois de responder', async () => {
      const { processador, extrairDoTurno, atualizarSeNecessario } = montar();

      await processador.process(job());

      expect(extrairDoTurno).toHaveBeenCalledOnce();
      expect(atualizarSeNecessario).toHaveBeenCalledWith(
        'escritorio-1',
        'conversa-1',
      );
    });

    it('falha na extração não desfaz a resposta já enviada', async () => {
      // Melhor esforço: a memória de longo prazo é importante, mas não a ponto
      // de transformar uma resposta entregue em job com falha e nova tentativa.
      const { processador, enfileirarEnvio } = montar({ extracaoFalha: true });

      const resultado = await processador.process(job());

      expect(resultado.respondeu).toBe(true);
      expect(enfileirarEnvio).toHaveBeenCalledOnce();
    });
  });
});

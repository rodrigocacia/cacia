import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getQueueToken } from '@nestjs/bullmq';
import type { Job, Queue } from 'bullmq';
import {
  AgentStyle,
  AgentType,
  ChatStatus,
  ConnectionStatus,
  MessageSender,
  MessageStatus,
} from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';
import { ChatsService } from '@/modules/chats/chats.service';
import { AgenteService } from '@/ai/agente/agente.service';
import { SumarizacaoService } from '@/ai/memoria/sumarizacao.service';
import { ExtracaoDeFatosService } from '@/ai/memoria/extracao-de-fatos.service';
import { AtendimentoProcessor } from '@/worker/processadores/atendimento.processor';
import {
  FILA,
  type JobAtendimento,
  type JobEnvioWhatsapp,
} from '@/worker/filas/filas';
import { Cliente } from './apoio/cliente';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { criarConta, type Conta } from './apoio/contas';

/**
 * O caminho inteiro de um atendimento: a mensagem chega e a resposta sai.
 *
 * Este arquivo cobre a costura que faltava. As peças existiam todas — webhook,
 * agente, memória, fila de envio — e nenhuma linha ligava uma à outra: uma
 * mensagem de cliente era gravada e o sistema não fazia mais nada.
 *
 * O modelo é dublado (ver AgenteFalso); o resto é real, incluindo as filas.
 */

const TOKEN_WEBHOOK = 'token-de-webhook-de-teste-com-24-mais';
const NUMERO = '5511988887777';

interface Contexto {
  conta: Conta;
  connectionId: string;
  sessao: string;
}

describe('conversa de ponta a ponta (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let publico: Cliente;
  let ctx: Contexto;

  let filaAtendimento: Queue<JobAtendimento>;
  let filaEnvio: Queue<JobEnvioWhatsapp>;
  let processador: AtendimentoProcessor;

  /** Evento de mensagem recebida, no formato do WAHA. */
  function eventoDeMensagem(
    corpo: string,
    extra: Record<string, unknown> = {},
  ) {
    return {
      event: 'message',
      session: ctx.sessao,
      payload: {
        id: `msg-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
        from: `${NUMERO}@c.us`,
        fromMe: false,
        body: corpo,
        notifyName: 'Joana',
        ...extra,
      },
    };
  }

  function entregarWebhook(corpo: unknown, token = TOKEN_WEBHOOK) {
    return publico
      .como({ cabecalhos: { 'x-webhook-token': token } })
      .post(`/webhooks/waha?office_id=${ctx.conta.officeId}`, corpo);
  }

  /** Executa o processador como o worker faria. */
  async function processarProximo(): Promise<unknown> {
    const [job] = await filaAtendimento.getJobs(['waiting', 'delayed']);

    if (!job) throw new Error('Nenhum job de atendimento na fila');

    const resultado = await processador.process(
      job as unknown as Job<JobAtendimento>,
    );
    await job.remove();

    return resultado;
  }

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    publico = new Cliente(aplicacao.url);

    const conta = await criarConta(aplicacao.url, 'Escritório da Conversa');

    // O webhook exige um agente de atendimento no escritório
    await conta.api.post('/agents', {
      type: AgentType.SUPPORT,
      style: AgentStyle.CLEAR_AND_OBJECTIVE,
      greeting: 'Olá! Como posso ajudar?',
    });

    const conexao = await conta.api.post<{ id: string }>('/connections', {});

    const linha = await aplicacao.prisma.connection.findUniqueOrThrow({
      where: { id: conexao.corpo.id },
      select: { wahaSession: true },
    });

    ctx = {
      conta,
      connectionId: conexao.corpo.id,
      sessao: linha.wahaSession!,
    };

    filaAtendimento = aplicacao.app.get(getQueueToken(FILA.ATENDIMENTO));
    filaEnvio = aplicacao.app.get(getQueueToken(FILA.ENVIO_WHATSAPP));

    processador = new AtendimentoProcessor(
      aplicacao.app.get(PrismaService),
      aplicacao.app.get(RedisService),
      aplicacao.app.get(ChatsService),
      aplicacao.app.get(AgenteService),
      aplicacao.app.get(SumarizacaoService),
      aplicacao.app.get(ExtracaoDeFatosService),
      filaAtendimento,
      filaEnvio,
    );
  });

  beforeEach(async () => {
    await filaAtendimento.drain(true);
    await filaEnvio.drain(true);
    aplicacao.agente.limpar();
  });

  afterAll(async () => {
    await filaAtendimento.obliterate({ force: true }).catch(() => undefined);
    await filaEnvio.obliterate({ force: true }).catch(() => undefined);
    await aplicacao.encerrar();
  });

  describe('a mensagem chega', () => {
    it('cria o lead, a conversa e grava a mensagem', async () => {
      const resposta = await entregarWebhook(
        eventoDeMensagem('Bom dia, preciso de ajuda com um processo'),
      );

      expect(resposta.status).toBe(200);

      const lead = await aplicacao.prisma.lead.findFirst({
        // Mesmo formato que a tela grava: é o que impede o contato duplicado
        where: { officeId: ctx.conta.officeId, remotejid: `${NUMERO}@c.us` },
        select: { id: true, name: true },
      });
      expect(lead?.name).toBe('Joana');

      const mensagem = await aplicacao.prisma.message.findFirst({
        where: { officeId: ctx.conta.officeId, leadId: lead!.id },
        select: { messageText: true, sender: true },
      });
      expect(mensagem?.messageText).toContain('preciso de ajuda');
      expect(mensagem?.sender).toBe(MessageSender.LEAD);
    });

    it('e pede a resposta do agente', async () => {
      // Era exatamente isto que não acontecia: a mensagem era gravada e o
      // sistema parava aí.
      await entregarWebhook(eventoDeMensagem('e aí, como fica?'));

      const jobs = await filaAtendimento.getJobs(['waiting', 'delayed']);

      expect(jobs).toHaveLength(1);
      expect(jobs[0]?.data).toMatchObject({
        officeId: ctx.conta.officeId,
        connectionId: ctx.connectionId,
        para: NUMERO,
      });
    });

    it('recusa webhook sem o token compartilhado', async () => {
      // Sem isso, qualquer um injetaria mensagens falsas no atendimento.
      const resposta = await entregarWebhook(
        eventoDeMensagem('mensagem forjada'),
        'token-errado',
      );

      expect(resposta.status).toBe(403);
    });

    it('responde 200 mesmo para evento que não sabe tratar', async () => {
      // Erro faria o WAHA reenviar e duplicar a mensagem.
      const resposta = await entregarWebhook({
        event: 'evento.inexistente',
        session: ctx.sessao,
      });

      expect(resposta.status).toBe(200);
    });

    it('ignora mensagem enviada pelo próprio sistema', async () => {
      await entregarWebhook(
        eventoDeMensagem('resposta que o bot mandou', { fromMe: true }),
      );

      expect(
        await filaAtendimento.getJobs(['waiting', 'delayed']),
      ).toHaveLength(0);
    });
  });

  describe('a resposta sai', () => {
    it('o agente responde, a resposta é gravada e enfileirada para envio', async () => {
      aplicacao.agente.texto = 'Bom dia, Joana! Vou verificar seu processo.';

      await entregarWebhook(eventoDeMensagem('Bom dia, e o meu processo?'));
      const resultado = await processarProximo();

      expect(resultado).toMatchObject({ respondeu: true });

      const doAgente = await aplicacao.prisma.message.findFirst({
        where: {
          officeId: ctx.conta.officeId,
          sender: MessageSender.AGENT,
        },
        orderBy: { createdAt: 'desc' },
        select: { messageText: true },
      });
      expect(doAgente?.messageText).toBe(
        'Bom dia, Joana! Vou verificar seu processo.',
      );

      const envios = await filaEnvio.getJobs(['waiting', 'delayed']);
      expect(envios).toHaveLength(1);
      expect(envios[0]?.data).toMatchObject({
        connectionId: ctx.connectionId,
        para: NUMERO,
        texto: 'Bom dia, Joana! Vou verificar seu processo.',
      });
    });

    it('a resposta sai pela MESMA conexão por onde a mensagem entrou', async () => {
      // Um escritório com duas conexões responderia pelo número errado.
      await entregarWebhook(eventoDeMensagem('outra pergunta'));
      await processarProximo();

      const envios = await filaEnvio.getJobs(['waiting', 'delayed']);

      expect(envios[0]?.data.connectionId).toBe(ctx.connectionId);
    });
  });

  describe('mensagens seguidas', () => {
    it('viram um turno só, com uma resposta só', async () => {
      // Quem escreve "oi" / "tenho uma dúvida" / "sobre o processo" em três
      // mensagens não pode receber três respostas desconexas.
      await entregarWebhook(eventoDeMensagem('oi'));
      await entregarWebhook(eventoDeMensagem('tenho uma dúvida'));
      await entregarWebhook(eventoDeMensagem('sobre o meu processo'));

      const jobs = await filaAtendimento.getJobs(['waiting', 'delayed']);
      expect(jobs).toHaveLength(3);

      await processarProximo();

      const pedido = aplicacao.agente.chamadas.at(-1)?.argumentos[0] as {
        mensagem: string;
      };
      expect(pedido.mensagem).toBe(
        'oi\ntenho uma dúvida\nsobre o meu processo',
      );

      // Os outros dois jobs não geram resposta nova
      const segundo = await processarProximo();
      const terceiro = await processarProximo();

      expect(segundo).toMatchObject({ respondeu: false });
      expect(terceiro).toMatchObject({ respondeu: false });
      expect(aplicacao.agente.vezes('responder')).toBe(1);
    });
  });

  describe('atendimento humano', () => {
    it('conversa com atendente não recebe resposta automática', async () => {
      const chat = await aplicacao.prisma.chat.findFirstOrThrow({
        where: { officeId: ctx.conta.officeId },
        select: { id: true },
      });

      await aplicacao.prisma.chat.update({
        where: { id: chat.id },
        data: { status: ChatStatus.PENDING },
      });

      await entregarWebhook(eventoDeMensagem('quero falar com alguém'));

      // A mensagem é gravada — o atendente precisa vê-la —, mas nada é pedido
      // ao agente.
      const mensagem = await aplicacao.prisma.message.findFirst({
        where: { officeId: ctx.conta.officeId, chatId: chat.id },
        orderBy: { createdAt: 'desc' },
        select: { messageText: true },
      });
      expect(mensagem?.messageText).toBe('quero falar com alguém');

      expect(
        await filaAtendimento.getJobs(['waiting', 'delayed']),
      ).toHaveLength(0);

      await aplicacao.prisma.chat.update({
        where: { id: chat.id },
        data: { status: ChatStatus.ACTIVE },
      });
    });
  });

  describe('o atendente responde pela plataforma', () => {
    async function conversa() {
      return aplicacao.prisma.chat.findFirstOrThrow({
        where: { officeId: ctx.conta.officeId },
        select: { id: true },
      });
    }

    async function conectar(status: ConnectionStatus) {
      await aplicacao.prisma.connection.update({
        where: { id: ctx.connectionId },
        data: { status },
      });
    }

    it('a lista traz a última mensagem e a etapa do lead', async () => {
      await entregarWebhook(eventoDeMensagem('última da lista'));

      const resposta = await ctx.conta.api.get<{
        data: {
          messages: { messageText: string }[];
          lead: { stage: { name: string } | null } | null;
        }[];
      }>('/chats');

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.data[0]?.messages[0]?.messageText).toBe(
        'última da lista',
      );
      expect(resposta.corpo.data[0]?.lead?.stage?.name).toBeTruthy();
    });

    it('busca pelo telefone e filtra pelo lead', async () => {
      const chat = await aplicacao.prisma.chat.findFirstOrThrow({
        where: { officeId: ctx.conta.officeId },
        select: { leadId: true },
      });

      const porTelefone = await ctx.conta.api.get<{ data: unknown[] }>(
        `/chats?search=${NUMERO.slice(-6)}`,
      );
      expect(porTelefone.corpo.data).toHaveLength(1);

      const porLead = await ctx.conta.api.get<{ data: unknown[] }>(
        `/chats?leadId=${chat.leadId}`,
      );
      expect(porLead.corpo.data).toHaveLength(1);

      const nada = await ctx.conta.api.get<{ data: unknown[] }>(
        '/chats?search=ninguem-com-este-nome',
      );
      expect(nada.corpo.data).toHaveLength(0);
    });

    it('recusa enviar sem WhatsApp conectado', async () => {
      // Gravar a mensagem aqui faria o advogado achar que ela saiu.
      await conectar(ConnectionStatus.DISCONNECTED);
      const { id } = await conversa();

      const resposta = await ctx.conta.api.post(`/chats/${id}/messages`, {
        text: 'Olá, aqui é a Dra. Helena',
      });

      expect(resposta.status).toBe(422);
      expect(
        await aplicacao.prisma.message.count({
          where: { chatId: id, sender: MessageSender.USER },
        }),
      ).toBe(0);
    });

    it('grava, enfileira pela conexão e tira a conversa do automático', async () => {
      await conectar(ConnectionStatus.CONNECTED);
      const { id } = await conversa();

      const resposta = await ctx.conta.api.post<{
        id: string;
        status: string;
        sender: string;
      }>(`/chats/${id}/messages`, { text: '  Olá, aqui é a Dra. Helena  ' });

      expect(resposta.status).toBe(201);
      expect(resposta.corpo).toMatchObject({
        sender: MessageSender.USER,
        status: MessageStatus.PENDING,
      });

      const [envio] = await filaEnvio.getJobs(['waiting', 'delayed']);
      expect(envio?.data).toMatchObject({
        connectionId: ctx.connectionId,
        para: `${NUMERO}@c.us`,
        texto: 'Olá, aqui é a Dra. Helena',
        chatId: id,
        messageId: resposta.corpo.id,
      });

      // Com a IA ligada, o contato receberia duas respostas
      const chat = await aplicacao.prisma.chat.findUniqueOrThrow({
        where: { id },
        select: { status: true },
      });
      expect(chat.status).toBe(ChatStatus.PENDING);

      await entregarWebhook(eventoDeMensagem('obrigada, doutora'));
      expect(
        await filaAtendimento.getJobs(['waiting', 'delayed']),
      ).toHaveLength(0);
    });

    it('recusa mensagem vazia', async () => {
      const { id } = await conversa();

      const resposta = await ctx.conta.api.post(`/chats/${id}/messages`, {
        text: '   ',
      });

      expect(resposta.status).toBe(400);
    });

    it('devolve para a IA e assume de novo', async () => {
      const { id } = await conversa();

      const devolvida = await ctx.conta.api.post<{ status: string }>(
        `/chats/${id}/release`,
      );
      expect(devolvida.corpo.status).toBe(ChatStatus.ACTIVE);

      await entregarWebhook(eventoDeMensagem('ainda está aí?'));
      expect(
        await filaAtendimento.getJobs(['waiting', 'delayed']),
      ).toHaveLength(1);

      const assumida = await ctx.conta.api.post<{ status: string }>(
        `/chats/${id}/take-over`,
      );
      expect(assumida.corpo.status).toBe(ChatStatus.PENDING);

      await ctx.conta.api.post(`/chats/${id}/release`);
    });

    it('envia arquivo: vai para o storage e sai pela fila com a chave', async () => {
      await conectar(ConnectionStatus.CONNECTED);
      const { id } = await conversa();

      const resposta = await ctx.conta.api.postArquivo<{
        id: string;
        type: string;
        messageCaption: string;
        messageFileUrl: string;
      }>(
        `/chats/${id}/attachments`,
        {
          nome: 'procuracao.pdf',
          conteudo: '%PDF-1.4 teste',
          tipo: 'application/pdf',
        },
        { caption: 'Segue a procuração' },
      );

      expect(resposta.status).toBe(201);
      expect(resposta.corpo).toMatchObject({
        type: 'DOCUMENT',
        messageCaption: 'Segue a procuração',
      });
      // A tela recebe link assinado, nunca a chave crua do storage
      expect(resposta.corpo.messageFileUrl).toMatch(
        /^https:\/\/storage\.teste\//,
      );

      const envio = (await filaEnvio.getJobs(['waiting', 'delayed'])).find(
        (j) => j.data.messageId === resposta.corpo.id,
      );
      expect(envio?.data).toMatchObject({
        tipo: 'DOCUMENT',
        legenda: 'Segue a procuração',
        arquivo: {
          mimetype: 'application/pdf',
          filename: 'procuracao.pdf',
        },
      });
      expect(envio?.data.arquivo?.chave).toMatch(
        new RegExp(`^${ctx.conta.officeId}/`),
      );
    });

    it('áudio gravado no navegador vira mensagem de áudio', async () => {
      const { id } = await conversa();

      const resposta = await ctx.conta.api.postArquivo<{ type: string }>(
        `/chats/${id}/attachments`,
        {
          nome: 'audio.webm',
          conteudo: Buffer.from([1, 2, 3]),
          tipo: 'audio/webm;codecs=opus',
        },
      );

      expect(resposta.status).toBe(201);
      expect(resposta.corpo.type).toBe('AUDIO');
    });

    it('recusa anexo sem arquivo', async () => {
      const { id } = await conversa();

      const resposta = await ctx.conta.api.post(`/chats/${id}/attachments`);

      expect(resposta.status).toBe(400);
    });

    it('o eco do envio pela tela não duplica a mensagem', async () => {
      const { id } = await conversa();

      await ctx.conta.api.post(`/chats/${id}/messages`, {
        text: 'Mensagem com eco',
      });

      await entregarWebhook({
        ...eventoDeMensagem('Mensagem com eco', {
          id: 'true_eco@c.us_ECO123',
          fromMe: true,
          from: '5511000000000@c.us',
          to: `${NUMERO}@c.us`,
        }),
        event: 'message.any',
      });

      const iguais = await aplicacao.prisma.message.findMany({
        where: { chatId: id, messageText: 'Mensagem com eco' },
        select: { externalId: true },
      });
      expect(iguais).toHaveLength(1);
      // O eco deixa o id, que é por onde a entrega vai chegar
      expect(iguais[0]?.externalId).toBe('ECO123');
    });

    it('entregue e lida chegam na mensagem, e nunca voltam atrás', async () => {
      const { id } = await conversa();

      async function ack(valor: number) {
        await entregarWebhook({
          event: 'message.ack',
          session: ctx.sessao,
          payload: {
            id: 'true_5511@c.us_ECO123',
            timestamp: Date.now(),
            from: '5511000000000@c.us',
            fromMe: true,
            ack: valor,
          },
        });

        const m = await aplicacao.prisma.message.findFirstOrThrow({
          where: { chatId: id, externalId: 'ECO123' },
          select: { status: true },
        });
        return m.status;
      }

      expect(await ack(2)).toBe(MessageStatus.DELIVERED);
      expect(await ack(3)).toBe(MessageStatus.READ);
      // "Entregue" atrasado não apaga o visto azul
      expect(await ack(2)).toBe(MessageStatus.READ);
    });

    it('o que o advogado digita no celular aparece na conversa', async () => {
      const { id } = await conversa();
      await ctx.conta.api.post(`/chats/${id}/release`);

      const resposta = await entregarWebhook({
        ...eventoDeMensagem('Respondi pelo celular', {
          id: 'true_cel@c.us_CEL999',
          fromMe: true,
          from: '5511000000000@c.us',
          to: `${NUMERO}@c.us`,
        }),
        event: 'message.any',
      });
      expect(resposta.status).toBe(200);

      const gravada = await aplicacao.prisma.message.findFirst({
        where: { chatId: id, externalId: 'CEL999' },
        select: { sender: true, status: true, messageText: true },
      });
      expect(gravada).toEqual({
        sender: MessageSender.USER,
        status: MessageStatus.SENT,
        messageText: 'Respondi pelo celular',
      });

      // Quem respondeu pelo celular assumiu: a IA não responde por cima
      const chat = await aplicacao.prisma.chat.findUniqueOrThrow({
        where: { id },
        select: { status: true },
      });
      expect(chat.status).toBe(ChatStatus.PENDING);
      expect(
        await filaAtendimento.getJobs(['waiting', 'delayed']),
      ).toHaveLength(0);

      // Reentregue pelo WAHA, não duplica
      await entregarWebhook({
        ...eventoDeMensagem('Respondi pelo celular', {
          id: 'true_cel@c.us_CEL999',
          fromMe: true,
          from: '5511000000000@c.us',
          to: `${NUMERO}@c.us`,
        }),
        event: 'message.any',
      });
      expect(
        await aplicacao.prisma.message.count({
          where: { chatId: id, externalId: 'CEL999' },
        }),
      ).toBe(1);

      await ctx.conta.api.post(`/chats/${id}/release`);
    });

    it('outro escritório não envia nem assume a conversa', async () => {
      const outra = await criarConta(aplicacao.url, 'Escritório Intruso');
      const { id } = await conversa();

      const envio = await outra.api.post(`/chats/${id}/messages`, {
        text: 'mensagem de intruso',
      });
      const assumir = await outra.api.post(`/chats/${id}/take-over`);

      expect(envio.status).toBe(404);
      expect(assumir.status).toBe(404);
    });
  });

  describe('lead convertido em cliente', () => {
    it('continua na mesma conversa, com o histórico de antes', async () => {
      const antes = await aplicacao.prisma.chat.findFirstOrThrow({
        where: { officeId: ctx.conta.officeId },
        select: { id: true, leadId: true },
      });

      const conversao = await ctx.conta.api.post<{ customerId: string }>(
        `/leads/${antes.leadId}/convert`,
        { document: '52998224725' },
      );
      expect(conversao.status).toBe(201);

      await entregarWebhook(eventoDeMensagem('agora sou cliente'));

      const conversas = await aplicacao.prisma.chat.findMany({
        where: { officeId: ctx.conta.officeId, deletedAt: null },
        select: { id: true, customerId: true, type: true },
      });
      expect(conversas).toHaveLength(1);
      expect(conversas[0]).toMatchObject({
        id: antes.id,
        customerId: conversao.corpo.customerId,
        type: 'CUSTOMER',
      });

      const ultima = await aplicacao.prisma.message.findFirstOrThrow({
        where: { chatId: antes.id },
        orderBy: { createdAt: 'desc' },
        select: { messageText: true, sender: true },
      });
      expect(ultima).toEqual({
        messageText: 'agora sou cliente',
        sender: MessageSender.CUSTOMER,
      });
    });
  });

  describe('isolamento', () => {
    it('a mensagem de um escritório não cria nada no outro', async () => {
      const outra = await criarConta(aplicacao.url, 'Escritório de Fora');

      const antes = await aplicacao.prisma.lead.count({
        where: { officeId: outra.officeId },
      });

      await entregarWebhook(eventoDeMensagem('mensagem do escritório de cá'));

      const depois = await aplicacao.prisma.lead.count({
        where: { officeId: outra.officeId },
      });

      expect(depois).toBe(antes);
    });
  });
});

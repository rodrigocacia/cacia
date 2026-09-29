import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  ChatStatus,
  ConnectionStatus,
  MessageSender,
  MessageStatus,
  MessageType,
  WahaSessionStatus,
} from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { StorageService } from '@/infra/storage/storage.service';
import { WahaService, type ConfigWaha } from '@/integrations/waha/waha.service';
import { ChatsService } from '@/modules/chats/chats.service';
import { idCurto } from '@/modules/chats/id-do-whatsapp';
import { normalizarRemotejid } from '@/modules/leads/remotejid';
import { PipelinesService } from '@/modules/pipelines/pipelines.service';
import { projetarStatus } from '@/modules/leads/projecao-de-status';
import { FILA, type JobAtendimento } from '@/worker/filas/filas';
import type {
  EventoWahaDto,
  PayloadMensagemWaha,
} from './dto/waha-webhook.dto';

/** Quanto tempo depois do envio o eco de uma mensagem ainda é esperado. */
const JANELA_DO_ECO_MS = 2 * 60 * 1000;

/** Ordem dos estados de entrega: um evento atrasado nunca faz voltar. */
const ESTADO_PELO_ACK: Record<number, MessageStatus> = {
  1: MessageStatus.SENT,
  2: MessageStatus.DELIVERED,
  3: MessageStatus.READ,
  4: MessageStatus.READ,
};

const ANTERIORES: Record<MessageStatus, MessageStatus[]> = {
  [MessageStatus.PENDING]: [],
  [MessageStatus.FAILED]: [],
  [MessageStatus.SENT]: [MessageStatus.PENDING, MessageStatus.FAILED],
  [MessageStatus.DELIVERED]: [
    MessageStatus.PENDING,
    MessageStatus.FAILED,
    MessageStatus.SENT,
  ],
  [MessageStatus.READ]: [
    MessageStatus.PENDING,
    MessageStatus.FAILED,
    MessageStatus.SENT,
    MessageStatus.DELIVERED,
  ],
};

type Conexao = { id: string; apiUrl: string; apiKey: string };

/**
 * Recebe os eventos do WAHA e os traduz para o modelo do sistema.
 *
 * Nunca lança: um erro aqui devolveria falha ao WAHA, que reenviaria o evento e
 * poderia duplicar a mensagem. Problemas são registrados e o webhook responde
 * 200 mesmo assim.
 */
@Injectable()
export class WahaWebhookService {
  private readonly logger = new Logger(WahaWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly waha: WahaService,
    private readonly chats: ChatsService,
    private readonly pipelines: PipelinesService,
    private readonly storage: StorageService,
    @InjectQueue(FILA.ATENDIMENTO)
    private readonly atendimento: Queue<JobAtendimento>,
  ) {}

  async processar(officeId: string, evento: EventoWahaDto): Promise<void> {
    try {
      if (
        evento.event === 'session.status' ||
        evento.event === 'state.change'
      ) {
        await this.atualizarEstadoDaSessao(officeId, evento);
        return;
      }

      if (evento.event === 'message.ack') {
        await this.atualizarEntrega(officeId, evento.payload);
        return;
      }

      // `message` vem de sessões criadas antes da troca para `message.any`
      if (evento.event !== 'message' && evento.event !== 'message.any') {
        return;
      }

      await this.processarMensagem(officeId, evento);
    } catch (erro) {
      this.logger.error(
        `Falha ao processar evento ${evento.event} do escritório ${officeId}: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
    }
  }

  private async atualizarEstadoDaSessao(
    officeId: string,
    evento: EventoWahaDto,
  ): Promise<void> {
    const estado = evento.payload?.status as WahaSessionStatus | undefined;
    if (!estado) return;

    const conectada = estado === WahaSessionStatus.WORKING;

    await this.prisma.connection.updateMany({
      where: { officeId, wahaSession: evento.session, deletedAt: null },
      data: {
        wahaState: estado,
        status: conectada
          ? ConnectionStatus.CONNECTED
          : ConnectionStatus.DISCONNECTED,
        ...(evento.me && {
          wahaPhone: evento.me.id.replace('@c.us', ''),
          wahaProfileName: evento.me.pushName,
        }),
      },
    });

    this.logger.log(`Sessão ${evento.session} agora está ${estado}`);
  }

  private async processarMensagem(
    officeId: string,
    evento: EventoWahaDto,
  ): Promise<void> {
    const payload = evento.payload;

    if (!payload) return;
    if (!payload.body && !payload.hasMedia) return;

    // O WAHA reentrega o evento quando a resposta demora; o id impede que a
    // mesma mensagem apareça duas vezes na conversa.
    const externalId = idCurto(payload.id);
    if (externalId && (await this.jaGravada(officeId, externalId))) return;

    const linha = await this.prisma.connection.findFirst({
      where: { officeId, wahaSession: evento.session, deletedAt: null },
      select: { id: true, wahaApiHost: true, wahaApiKey: true },
    });

    if (!linha?.wahaApiHost || !linha.wahaApiKey) {
      this.logger.warn(
        `Evento de sessão sem conexão configurada: ${evento.session}`,
      );
      return;
    }

    const conexao: Conexao = {
      id: linha.id,
      apiUrl: linha.wahaApiHost,
      apiKey: linha.wahaApiKey,
    };

    if (payload.fromMe) {
      await this.processarMensagemPropria(
        officeId,
        evento.session,
        conexao,
        payload,
      );
      return;
    }

    const remetente = await this.resolverRemetente(
      evento.session,
      payload.from,
      conexao,
    );

    // Grupos ficam de fora: o atendimento é individual, e uma mensagem de grupo
    // criaria um lead com o identificador do grupo em vez de uma pessoa.
    if (remetente.includes('@g.us')) return;

    const contato = await this.encontrarOuCriarContato(
      officeId,
      remetente,
      payload.notifyName,
    );

    const chat = await this.chats.encontrarOuCriar({
      officeId,
      leadId: contato.leadId,
      customerId: contato.customerId,
      nomeContato: payload.notifyName,
    });

    await this.chats.registrarMensagem({
      officeId,
      chatId: chat.id,
      leadId: contato.leadId,
      customerId: contato.customerId,
      remetente: contato.customerId
        ? MessageSender.CUSTOMER
        : MessageSender.LEAD,
      externalId: externalId ?? undefined,
      ...(await this.conteudo(officeId, conexao, payload)),
    });

    await this.pedirResposta({
      officeId,
      chatId: chat.id,
      connectionId: conexao.id,
      para: remetente,
      status: chat.status,
    });
  }

  /**
   * Mensagem que saiu do número do escritório.
   *
   * Pode ser o eco do que o próprio sistema mandou (resposta da IA ou da
   * tela), ou algo que o advogado digitou no celular. O eco é reconhecido e
   * descartado; o resto entra na conversa como mensagem da equipe.
   *
   * Quem responde pelo celular assumiu a conversa, como quem responde pela
   * tela: a IA para, senão o contato receberia duas respostas.
   *
   * Contato desconhecido é ignorado: o número do escritório também fala com
   * quem não é lead nem cliente, e isso não deve virar ficha no funil.
   */
  private async processarMensagemPropria(
    officeId: string,
    sessao: string,
    conexao: Conexao,
    payload: PayloadMensagemWaha,
  ): Promise<void> {
    if (!payload.to) return;

    const destino = await this.resolverRemetente(sessao, payload.to, conexao);
    if (destino.includes('@g.us')) return;

    const contato = await this.localizarContato(officeId, destino);
    if (!contato) return;

    const chat = await this.chats.encontrarOuCriar({ officeId, ...contato });
    const externalId = idCurto(payload.id);

    if (await this.reconhecerEco(officeId, chat.id, payload, externalId)) {
      return;
    }

    await this.chats.registrarMensagem({
      officeId,
      chatId: chat.id,
      ...contato,
      remetente: MessageSender.USER,
      status: MessageStatus.SENT,
      externalId: externalId ?? undefined,
      ...(await this.conteudo(officeId, conexao, payload)),
    });

    if (chat.status === ChatStatus.ACTIVE) {
      await this.prisma.chat.update({
        where: { id: chat.id },
        data: { status: ChatStatus.PENDING },
      });
    }
  }

  /**
   * O eco do que o sistema acabou de enviar.
   *
   * Pelo id quando o worker já o gravou; senão, pela mensagem da equipe ou da
   * IA ainda sem id, recente, com o mesmo texto (ou do mesmo tipo, se for
   * mídia). O evento pode chegar antes de o worker gravar o id, por isso o
   * segundo caminho. Reconhecido, o id fica gravado para os avisos de entrega.
   */
  private async reconhecerEco(
    officeId: string,
    chatId: string,
    payload: PayloadMensagemWaha,
    externalId: string | null,
  ): Promise<boolean> {
    const tipo = this.classificarTipo(payload);

    const eco = await this.prisma.message.findFirst({
      where: {
        officeId,
        chatId,
        deletedAt: null,
        externalId: null,
        sender: { in: [MessageSender.USER, MessageSender.AGENT] },
        createdAt: { gte: new Date(Date.now() - JANELA_DO_ECO_MS) },
        ...(tipo === MessageType.TEXT
          ? { type: MessageType.TEXT, messageText: payload.body }
          : { type: tipo }),
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!eco) return false;

    if (externalId) {
      await this.prisma.message.update({
        where: { id: eco.id },
        data: { externalId },
      });
    }

    return true;
  }

  private async jaGravada(
    officeId: string,
    externalId: string,
  ): Promise<boolean> {
    const existente = await this.prisma.message.findFirst({
      where: { officeId, externalId },
      select: { id: true },
    });

    return Boolean(existente);
  }

  /**
   * Entrega e leitura de uma mensagem enviada.
   *
   * Só avança: o evento de "entregue" que chega depois do de "lida" não pode
   * desfazer o visto azul.
   */
  private async atualizarEntrega(
    officeId: string,
    payload: PayloadMensagemWaha | undefined,
  ): Promise<void> {
    const externalId = idCurto(payload?.id);
    if (!externalId || payload?.ack === undefined) return;

    if (payload.ack < 0) {
      await this.prisma.message.updateMany({
        where: {
          officeId,
          externalId,
          status: { in: [MessageStatus.PENDING, MessageStatus.SENT] },
        },
        data: { status: MessageStatus.FAILED },
      });
      return;
    }

    const novo = ESTADO_PELO_ACK[payload.ack];
    if (!novo) return;

    await this.prisma.message.updateMany({
      where: { officeId, externalId, status: { in: ANTERIORES[novo] } },
      data: { status: novo },
    });
  }

  /**
   * Texto e mídia da mensagem, com a mídia já no storage.
   *
   * O link do evento aponta para o WAHA, exige a chave da API e expira; a
   * cópia no storage é o que a tela consegue exibir depois. Falhar ao copiar
   * não perde a mensagem: ela entra sem o anexo.
   */
  private async conteudo(
    officeId: string,
    conexao: Conexao,
    payload: PayloadMensagemWaha,
  ) {
    const tipo = this.classificarTipo(payload);
    const mime = payload.media?.mimetype?.split(';')[0]?.trim();
    const extensao =
      payload.media?.filename?.split('.').pop() ?? mime?.split('/')[1];

    const base = {
      tipo,
      texto: tipo === MessageType.TEXT ? payload.body : undefined,
      legenda:
        tipo === MessageType.TEXT
          ? undefined
          : (payload.caption ?? payload.body),
      extensao,
    };

    if (!payload.media?.url) return base;

    try {
      const conteudo = await this.waha.baixarMidia(payload.media.url, conexao);

      const enviado = await this.storage.enviar({
        officeId,
        conteudo,
        nomeOriginal: payload.media.filename ?? `midia.${extensao ?? 'bin'}`,
        mimetype: mime ?? 'application/octet-stream',
      });

      return {
        ...base,
        arquivoUrl: enviado.chave,
        tamanhoBytes: enviado.tamanhoBytes,
      };
    } catch (erro) {
      this.logger.warn(
        `Não foi possível copiar a mídia da mensagem ${payload.id}: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
      return base;
    }
  }

  /**
   * Enfileira a resposta do agente.
   *
   * Fora da transação de gravação e depois dela: a mensagem recebida precisa
   * estar no banco antes de o worker ir lê-la. Enfileirar antes criaria uma
   * corrida em que o agente responderia sem enxergar o que a pessoa escreveu.
   *
   * A falha ao enfileirar não derruba o webhook. A mensagem já está gravada e
   * visível para o atendente humano — perder a resposta automática é ruim,
   * perder a mensagem seria muito pior.
   */
  private async pedirResposta(params: {
    officeId: string;
    chatId: string;
    connectionId: string;
    para: string;
    status: ChatStatus;
  }): Promise<void> {
    if (params.status !== ChatStatus.ACTIVE) {
      // Conversa com atendente humano, encerrada ou cancelada
      this.logger.log(
        `Conversa ${params.chatId} em ${params.status}: sem resposta automática`,
      );
      return;
    }

    const { status: _status, ...job } = params;

    try {
      await this.atendimento.add('responder', job, {
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
        removeOnFail: { count: 200 },
      });
    } catch (erro) {
      this.logger.error(
        `Não foi possível enfileirar a resposta da conversa ${params.chatId}: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
    }
  }

  /**
   * Resolve o remetente para um número de telefone real.
   *
   * O WhatsApp envia `@lid` no lugar do número quando o contato tem privacidade
   * ativa. Precisa ser resolvido antes de tudo: o motor GOWS recusa enviar para
   * um `@lid`, então gravar o lead com esse identificador quebraria a resposta.
   */
  private async resolverRemetente(
    sessao: string,
    de: string,
    config: ConfigWaha,
  ): Promise<string> {
    if (!de.includes('@lid')) return de.replace('@c.us', '');

    const telefone = await this.waha.resolverLid(sessao, de, config);

    if (!telefone) {
      this.logger.warn(`Não foi possível resolver o @lid ${de}`);
      return de;
    }

    return telefone;
  }

  /**
   * As formas como o mesmo número pode estar gravado.
   *
   * A tela grava `5511988887777@c.us` (ver normalizarRemotejid); o webhook,
   * até 29/09, gravava só os dígitos. Procurar pelas duas evita que o lead
   * cadastrado na tela vire um lead duplicado ao mandar a primeira mensagem.
   */
  private formasDoNumero(remotejid: string): string[] {
    const canonico = normalizarRemotejid(remotejid);
    return [...new Set([canonico, canonico.replace('@c.us', ''), remotejid])];
  }

  /** Cliente tem prioridade sobre lead, como em encontrarOuCriarContato. */
  private async localizarContato(
    officeId: string,
    remotejid: string,
  ): Promise<{ leadId?: string; customerId?: string } | null> {
    const formas = this.formasDoNumero(remotejid);

    const cliente = await this.prisma.customer.findFirst({
      where: { officeId, remotejid: { in: formas }, deletedAt: null },
      select: { id: true },
    });

    if (cliente) return { customerId: cliente.id };

    const lead = await this.prisma.lead.findFirst({
      where: { officeId, remotejid: { in: formas }, deletedAt: null },
      select: { id: true },
    });

    return lead ? { leadId: lead.id } : null;
  }

  /**
   * Localiza o contato pelo número, ou cria um lead.
   *
   * Cliente tem prioridade: quem já é cliente do escritório não deve virar lead
   * de novo ao mandar mensagem.
   */
  private async encontrarOuCriarContato(
    officeId: string,
    remotejid: string,
    nome?: string,
  ): Promise<{ leadId?: string; customerId?: string }> {
    const formas = this.formasDoNumero(remotejid);

    const cliente = await this.prisma.customer.findFirst({
      where: { officeId, remotejid: { in: formas }, deletedAt: null },
      select: { id: true },
    });

    if (cliente) return { customerId: cliente.id };

    // Sem `deletedAt: null` de proposito: a unicidade (office_id, remotejid)
    // nao ignora exclusao logica, entao criar outro lead para um numero ja
    // excluido estouraria no banco. Quem volta a escrever e restaurado.
    const lead = await this.prisma.lead.findFirst({
      where: { officeId, remotejid: { in: formas } },
      select: { id: true, deletedAt: true },
    });

    if (lead?.deletedAt) {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { deletedAt: null, lastActivityAt: new Date() },
      });

      this.logger.log(`Lead restaurado ao voltar a escrever: ${lead.id}`);

      return { leadId: lead.id };
    }

    if (lead) return { leadId: lead.id };

    // Quem chega pelo WhatsApp nao escolhe funil nem etapa: cai na primeira
    // etapa do funil padrao. Sem isso o lead nasceria fora do quadro, invisivel
    // para quem trabalha o funil.
    const etapa = await this.pipelines.etapaInicial(officeId);

    const novo = await this.prisma.lead.create({
      data: {
        officeId,
        remotejid: normalizarRemotejid(remotejid),
        name: nome ?? remotejid,
        lastActivityAt: new Date(),
        pipelineId: etapa.pipelineId,
        stageId: etapa.stageId,
        stageChangedAt: new Date(),
        status: projetarStatus(etapa),
      },
      select: { id: true },
    });

    await this.prisma.leadStageHistory.create({
      data: {
        officeId,
        leadId: novo.id,
        toStageId: etapa.stageId,
        userId: null,
      },
    });

    this.logger.log(`Lead criado a partir de mensagem recebida: ${novo.id}`);

    return { leadId: novo.id };
  }

  private classificarTipo(
    payload: NonNullable<EventoWahaDto['payload']>,
  ): MessageType {
    if (!payload.hasMedia) return MessageType.TEXT;

    const mime = payload.media?.mimetype ?? '';

    if (mime.startsWith('image/')) return MessageType.IMAGE;
    if (mime.startsWith('video/')) return MessageType.VIDEO;
    if (mime.startsWith('audio/')) return MessageType.AUDIO;

    return MessageType.DOCUMENT;
  }
}

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  ChatStatus,
  ConnectionStatus,
  MessageSender,
  MessageType,
  WahaSessionStatus,
} from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { WahaService } from '@/integrations/waha/waha.service';
import { ChatsService } from '@/modules/chats/chats.service';
import { FILA, type JobAtendimento } from '@/worker/filas/filas';
import type { EventoWahaDto } from './dto/waha-webhook.dto';

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

      if (evento.event !== 'message') return;

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

    // Mensagem enviada pelo próprio bot volta como evento; ignorar evita
    // gravar duas vezes o que o sistema acabou de mandar.
    if (!payload || payload.fromMe) return;
    if (!payload.body && !payload.hasMedia) return;

    const conexao = await this.prisma.connection.findFirst({
      where: { officeId, wahaSession: evento.session, deletedAt: null },
      select: { id: true, wahaApiHost: true, wahaApiKey: true },
    });

    if (!conexao?.wahaApiHost || !conexao.wahaApiKey) {
      this.logger.warn(
        `Evento de sessão sem conexão configurada: ${evento.session}`,
      );
      return;
    }

    const remetente = await this.resolverRemetente(
      evento.session,
      payload.from,
      { apiUrl: conexao.wahaApiHost, apiKey: conexao.wahaApiKey },
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
      tipo: this.classificarTipo(payload),
      texto: payload.body,
      legenda: payload.caption,
      arquivoUrl: payload.media?.url,
      extensao: payload.media?.mimetype?.split('/')[1],
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
    config: { apiUrl: string; apiKey: string },
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
    const cliente = await this.prisma.customer.findFirst({
      where: { officeId, remotejid, deletedAt: null },
      select: { id: true },
    });

    if (cliente) return { customerId: cliente.id };

    const lead = await this.prisma.lead.findFirst({
      where: { officeId, remotejid, deletedAt: null },
      select: { id: true },
    });

    if (lead) return { leadId: lead.id };

    const novo = await this.prisma.lead.create({
      data: {
        officeId,
        remotejid,
        name: nome ?? remotejid,
        lastActivityAt: new Date(),
      },
      select: { id: true },
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

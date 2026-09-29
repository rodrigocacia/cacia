import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { ChatStatus, MessageSender, MessageType } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';
import { ChatsService } from '@/modules/chats/chats.service';
import { AgenteService } from '@/ai/agente/agente.service';
import { SumarizacaoService } from '@/ai/memoria/sumarizacao.service';
import { ExtracaoDeFatosService } from '@/ai/memoria/extracao-de-fatos.service';
import {
  FILA,
  type JobAtendimento,
  type JobEnvioWhatsapp,
} from '../filas/filas';

export interface ResultadoAtendimento {
  respondeu: boolean;
  motivo?: string;
  ferramentasUsadas?: string[];
}

/**
 * Validade da trava por conversa.
 *
 * Longa o bastante para cobrir uma resposta lenta do modelo com ferramentas,
 * curta o bastante para que um worker que morra no meio não deixe a conversa
 * muda para sempre.
 */
const TRAVA_SEGUNDOS = 180;

/** Teto de mensagens juntadas em um turno. Acima disso, o resto vai no próximo. */
const MAX_MENSAGENS_POR_TURNO = 10;

/**
 * Responde à mensagem que chegou.
 *
 * É o elo entre o webhook e o agente. O webhook grava a mensagem e enfileira;
 * aqui a resposta é gerada, gravada e enviada.
 *
 * Três cuidados, cada um por um motivo concreto:
 *
 * 1. UMA RESPOSTA POR VEZ, por conversa. Quem manda três mensagens seguidas
 *    gera três jobs. Sem a trava, o cliente receberia três respostas — e as
 *    três teriam sido geradas sem enxergar umas às outras.
 *
 * 2. AS MENSAGENS PENDENTES VÃO JUNTAS. O turno é tudo o que a pessoa disse
 *    desde a última resposta do agente, não apenas a mensagem que disparou o
 *    job. É o que faz "oi" / "tenho uma dúvida" / "sobre meu processo" virar
 *    uma pergunta só.
 *
 * 3. QUEM ESTÁ COM ATENDENTE HUMANO NÃO RECEBE RESPOSTA AUTOMÁTICA. A conversa
 *    sai de ACTIVE quando o agente aciona uma pessoa; responder por cima disso
 *    seria o pior comportamento possível do sistema.
 */
@Processor(FILA.ATENDIMENTO)
export class AtendimentoProcessor extends WorkerHost {
  private readonly logger = new Logger(AtendimentoProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly chats: ChatsService,
    private readonly agente: AgenteService,
    private readonly sumarizacao: SumarizacaoService,
    private readonly extracao: ExtracaoDeFatosService,
    @InjectQueue(FILA.ATENDIMENTO)
    private readonly atendimento: Queue<JobAtendimento>,
    @InjectQueue(FILA.ENVIO_WHATSAPP)
    private readonly envio: Queue<JobEnvioWhatsapp>,
  ) {
    super();
  }

  async process(job: Job<JobAtendimento>): Promise<ResultadoAtendimento> {
    const { chatId } = job.data;

    if (!(await this.travar(chatId))) {
      // Outro job já está respondendo esta conversa. Ele relê as pendentes ao
      // terminar, então a mensagem que disparou este aqui não se perde.
      return { respondeu: false, motivo: 'resposta em andamento' };
    }

    try {
      return await this.atender(job.data);
    } finally {
      await this.destravar(chatId);
    }
  }

  private async atender(dados: JobAtendimento): Promise<ResultadoAtendimento> {
    const { officeId, chatId } = dados;

    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, officeId, deletedAt: null },
      select: {
        status: true,
        customerId: true,
        leadId: true,
      },
    });

    if (!chat) return { respondeu: false, motivo: 'conversa não encontrada' };

    if (chat.status !== ChatStatus.ACTIVE) {
      // Um atendente assumiu entre o enfileiramento e agora
      return { respondeu: false, motivo: `conversa em ${chat.status}` };
    }

    const pendentes = await this.mensagensPendentes(officeId, chatId);

    if (pendentes.length === 0) {
      // Já respondidas por um job anterior que juntou tudo
      return { respondeu: false, motivo: 'nada pendente' };
    }

    const resposta = await this.agente.responder({
      officeId,
      chatId,
      mensagem: pendentes.join('\n'),
      customerId: chat.customerId ?? undefined,
      leadId: chat.leadId ?? undefined,
    });

    const registrada = await this.chats.registrarMensagem({
      officeId,
      chatId,
      leadId: chat.leadId ?? undefined,
      customerId: chat.customerId ?? undefined,
      remetente: MessageSender.AGENT,
      tipo: MessageType.TEXT,
      texto: resposta.texto,
    });

    await this.envio.add(
      'enviar',
      {
        officeId,
        connectionId: dados.connectionId,
        para: dados.para,
        tipo: MessageType.TEXT,
        texto: resposta.texto,
        chatId,
        messageId: registrada.id,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );

    await this.consolidarMemoria(dados, chat, pendentes, resposta.texto);
    await this.reenfileirarSeChegouMaisAlguma(dados);

    return { respondeu: true, ferramentasUsadas: resposta.ferramentasUsadas };
  }

  /**
   * O que a pessoa disse desde a última resposta do escritório.
   *
   * Sem esse recorte, cada mensagem viraria um turno isolado e o agente
   * responderia "oi" antes de ler a pergunta que veio logo em seguida.
   *
   * A resposta de um atendente (pela tela ou pelo celular) também encerra o
   * turno, e as mensagens dele nunca entram como fala do contato: devolvida a
   * conversa para a IA, ela responderia ao próprio advogado.
   */
  private async mensagensPendentes(
    officeId: string,
    chatId: string,
  ): Promise<string[]> {
    const ultimaDoAgente = await this.prisma.message.findFirst({
      where: {
        officeId,
        chatId,
        sender: { in: [MessageSender.AGENT, MessageSender.USER] },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const mensagens = await this.prisma.message.findMany({
      where: {
        officeId,
        chatId,
        deletedAt: null,
        sender: { in: [MessageSender.LEAD, MessageSender.CUSTOMER] },
        ...(ultimaDoAgente && {
          createdAt: { gt: ultimaDoAgente.createdAt },
        }),
      },
      orderBy: { createdAt: 'asc' },
      take: MAX_MENSAGENS_POR_TURNO,
      select: { messageText: true, messageCaption: true, type: true },
    });

    return mensagens
      .map((m) => this.textoDe(m))
      .filter((texto): texto is string => texto !== null);
  }

  /**
   * Texto que representa a mensagem para o agente.
   *
   * Mídia sem legenda vira uma menção ao tipo: o modelo precisa saber que algo
   * chegou, mesmo sem conseguir ler o conteúdo. Devolver nada faria a resposta
   * ignorar um documento que a pessoa acabou de enviar.
   */
  private textoDe(mensagem: {
    messageText: string | null;
    messageCaption: string | null;
    type: MessageType;
  }): string | null {
    const texto = mensagem.messageText ?? mensagem.messageCaption;

    if (texto?.trim()) return texto.trim();

    switch (mensagem.type) {
      case MessageType.IMAGE:
        return '[a pessoa enviou uma imagem]';
      case MessageType.AUDIO:
        return '[a pessoa enviou um áudio]';
      case MessageType.VIDEO:
        return '[a pessoa enviou um vídeo]';
      case MessageType.DOCUMENT:
        return '[a pessoa enviou um documento]';
      default:
        return null;
    }
  }

  /**
   * Resumo e extração de fatos, depois de responder.
   *
   * Melhor esforço: são o que mantém a memória viva a longo prazo, mas uma
   * falha aqui não pode desfazer uma resposta que já foi enviada.
   */
  private async consolidarMemoria(
    dados: JobAtendimento,
    chat: { customerId: string | null; leadId: string | null },
    pendentes: string[],
    resposta: string,
  ): Promise<void> {
    const tarefas = [
      this.extracao.extrairDoTurno({
        officeId: dados.officeId,
        chatId: dados.chatId,
        mensagemCliente: pendentes.join('\n'),
        respostaAgente: resposta,
        customerId: chat.customerId ?? undefined,
        leadId: chat.leadId ?? undefined,
      }),
      this.sumarizacao.atualizarSeNecessario(dados.officeId, dados.chatId),
    ];

    const resultados = await Promise.allSettled(tarefas);

    for (const resultado of resultados) {
      if (resultado.status === 'rejected') {
        this.logger.warn(
          `Consolidação de memória falhou na conversa ${dados.chatId}: ${
            resultado.reason instanceof Error
              ? resultado.reason.message
              : 'erro'
          }`,
        );
      }
    }
  }

  /**
   * Mensagem que chegou enquanto o agente respondia.
   *
   * O job dela foi recusado pela trava. Sem este reenfileiramento, ela ficaria
   * sem resposta até a pessoa escrever de novo.
   */
  private async reenfileirarSeChegouMaisAlguma(
    dados: JobAtendimento,
  ): Promise<void> {
    const pendentes = await this.mensagensPendentes(
      dados.officeId,
      dados.chatId,
    );

    if (pendentes.length === 0) return;

    this.logger.log(
      `Mensagem nova durante a resposta na conversa ${dados.chatId}; reenfileirando`,
    );

    await this.atendimento.add('responder', dados, {
      attempts: 2,
      removeOnComplete: true,
    });
  }

  // ---- trava por conversa --------------------------------------------------

  private chaveDaTrava(chatId: string): string {
    return `atendimento:travado:${chatId}`;
  }

  private async travar(chatId: string): Promise<boolean> {
    const resultado = await this.redis.client.set(
      this.chaveDaTrava(chatId),
      '1',
      'EX',
      TRAVA_SEGUNDOS,
      'NX',
    );

    return resultado === 'OK';
  }

  private async destravar(chatId: string): Promise<void> {
    await this.redis.client.del(this.chaveDaTrava(chatId)).catch(() => 0);
  }
}

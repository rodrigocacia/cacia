import { Injectable, Logger } from '@nestjs/common';
import { MessageSender } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';
import { QdrantService } from '@/integrations/qdrant/qdrant.service';
import { EmbeddingsService } from '../embeddings.service';

export interface TurnoConversa {
  papel: 'user' | 'assistant';
  conteudo: string;
}

export interface ContextoMemoria {
  /** Últimos turnos, literais. */
  recentes: TurnoConversa[];
  /** Resumo do que veio antes. */
  resumo: string | null;
  /** Fatos permanentes relevantes para a mensagem atual. */
  fatos: string[];
}

/** Quantos turnos ficam literais na camada quente. */
const TURNOS_QUENTES = 4;
/** Validade da camada quente. Passado isso, o resumo assume. */
const TTL_QUENTE_SEGUNDOS = 24 * 60 * 60;
/** Quantos fatos são recuperados por mensagem. */
const FATOS_POR_CONSULTA = 3;

/**
 * Memória do agente, em três camadas.
 *
 * O sistema anterior guardava as últimas 20 MENSAGENS num único bloco no Redis.
 * Parecia razoável, mas cada turno com ferramentas gravava de 3 a 5 entradas —
 * a pergunta, a decisão da IA, o resultado de cada ferramenta e a resposta.
 * A janela real virava 4 a 6 turnos, e os resultados de ferramenta, que são
 * JSON bruto, ocupavam a maior parte do espaço, empurrando as falas do cliente
 * para fora. Passado esse limite, o que saía era perdido em definitivo.
 *
 * Aqui:
 *
 *   quente  Redis     últimos 4 turnos, literais         ~500 tokens
 *   morna   Postgres  resumo rolante do que veio antes   ~200 tokens
 *   fria    Qdrant    fatos permanentes, por relevância  ~100 tokens
 *
 * Resultado de ferramenta NUNCA entra na memória — só o fato que dele decorre.
 * Era isso que consumia a janela antiga.
 */
@Injectable()
export class MemoriaService {
  private readonly logger = new Logger(MemoriaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly qdrant: QdrantService,
    private readonly embeddings: EmbeddingsService,
  ) {}

  /**
   * Monta o contexto para uma mensagem.
   *
   * As três camadas são consultadas em paralelo: a busca vetorial é a mais
   * lenta e não deve somar sua latência à das outras.
   */
  async montarContexto(
    officeId: string,
    chatId: string,
    mensagemAtual: string,
  ): Promise<ContextoMemoria> {
    const [recentes, resumo, fatos] = await Promise.all([
      this.lerCamadaQuente(chatId),
      this.lerCamadaMorna(officeId, chatId),
      this.lerCamadaFria(officeId, chatId, mensagemAtual),
    ]);

    return { recentes, resumo, fatos };
  }

  // ---- camada quente -------------------------------------------------------

  private chaveQuente(chatId: string): string {
    return `memoria:quente:${chatId}`;
  }

  private async lerCamadaQuente(chatId: string): Promise<TurnoConversa[]> {
    try {
      const bruto = await this.redis.client.lrange(
        this.chaveQuente(chatId),
        -TURNOS_QUENTES * 2,
        -1,
      );

      return bruto.map((linha) => JSON.parse(linha) as TurnoConversa);
    } catch (erro) {
      // Sem a camada quente o agente ainda responde, com o resumo e os fatos.
      this.logger.warn(
        `Camada quente indisponível: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
      return [];
    }
  }

  /**
   * Grava um turno na camada quente.
   *
   * Usa uma lista com corte: `rpush` acrescenta e `ltrim` mantém apenas os
   * últimos. Diferente do sistema anterior, não há leitura e reescrita do bloco
   * inteiro a cada mensagem.
   */
  async registrarTurno(chatId: string, turno: TurnoConversa): Promise<void> {
    const chave = this.chaveQuente(chatId);

    await this.redis.client
      .multi()
      .rpush(chave, JSON.stringify(turno))
      .ltrim(chave, -TURNOS_QUENTES * 2, -1)
      .expire(chave, TTL_QUENTE_SEGUNDOS)
      .exec();
  }

  async limparCamadaQuente(chatId: string): Promise<void> {
    await this.redis.client.del(this.chaveQuente(chatId));
  }

  // ---- camada morna --------------------------------------------------------

  private async lerCamadaMorna(
    officeId: string,
    chatId: string,
  ): Promise<string | null> {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, officeId, deletedAt: null },
      select: { summary: true },
    });

    return chat?.summary ?? null;
  }

  /** Substitui o resumo da conversa. Chamado pelo worker de sumarização. */
  async gravarResumo(
    officeId: string,
    chatId: string,
    resumo: string,
    mensagensIncorporadas: number,
  ): Promise<void> {
    await this.prisma.chat.updateMany({
      where: { id: chatId, officeId },
      data: {
        summary: resumo,
        summaryUpdatedAt: new Date(),
        summarizedMessageCount: mensagensIncorporadas,
      },
    });
  }

  // ---- camada fria ---------------------------------------------------------

  /**
   * Recupera os fatos mais relevantes para a mensagem atual.
   *
   * Busca por similaridade em vez de trazer tudo: um cliente com cinquenta
   * anotações não pode despejar as cinquenta no contexto. O que entra são as
   * poucas que têm a ver com o que está sendo perguntado agora.
   */
  private async lerCamadaFria(
    officeId: string,
    chatId: string,
    mensagemAtual: string,
  ): Promise<string[]> {
    if (mensagemAtual.trim().length < 3) return [];

    try {
      const vetor = await this.embeddings.gerar(mensagemAtual);

      const resultados = await this.qdrant.buscar(
        vetor,
        { officeId, kind: 'memory_fact', chatId },
        FATOS_POR_CONSULTA,
      );

      return resultados.map((r) => r.payload.content);
    } catch (erro) {
      this.logger.warn(
        `Camada fria indisponível: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
      return [];
    }
  }

  /**
   * Indexa uma anotação como fato recuperável.
   *
   * Os fatos vêm da tabela de anotações (Mark), que já existia: preferências,
   * endereço, feedback. A diferença é que agora são recuperáveis por
   * similaridade, em vez de só listáveis.
   */
  async indexarFato(params: {
    markId: string;
    officeId: string;
    chatId: string;
    conteudo: string;
    customerId?: string;
    leadId?: string;
  }): Promise<void> {
    const vetor = await this.embeddings.gerar(params.conteudo);

    await this.qdrant.inserir([
      {
        id: params.markId,
        vetor,
        payload: {
          officeId: params.officeId,
          kind: 'memory_fact',
          content: params.conteudo,
          chatId: params.chatId,
          customerId: params.customerId,
          leadId: params.leadId,
          markId: params.markId,
          createdAt: new Date().toISOString(),
        },
      },
    ]);

    await this.prisma.mark.updateMany({
      where: { id: params.markId, officeId: params.officeId },
      data: { vectorId: params.markId, vectorIndexedAt: new Date() },
    });
  }

  // ---- montagem do prompt --------------------------------------------------

  /**
   * Converte o contexto em texto para o prompt.
   *
   * O orçamento é fixo por construção: quatro turnos, um resumo e três fatos.
   * Uma conversa de duzentas mensagens ocupa o mesmo espaço que uma de dez.
   */
  formatarParaPrompt(contexto: ContextoMemoria): string {
    const partes: string[] = [];

    if (contexto.fatos.length > 0) {
      partes.push(
        `O que já sabemos sobre este contato:\n${contexto.fatos
          .map((f) => `- ${f}`)
          .join('\n')}`,
      );
    }

    if (contexto.resumo) {
      partes.push(`Resumo da conversa até aqui:\n${contexto.resumo}`);
    }

    return partes.join('\n\n');
  }

  /** Turnos recentes no formato de mensagens da API. */
  turnosComoMensagens(
    contexto: ContextoMemoria,
  ): { role: 'user' | 'assistant'; content: string }[] {
    return contexto.recentes.map((t) => ({
      role: t.papel,
      content: t.conteudo,
    }));
  }

  /** Converte o remetente do banco no papel esperado pela API do modelo. */
  static papelDe(remetente: MessageSender): 'user' | 'assistant' {
    return remetente === MessageSender.AGENT ? 'assistant' : 'user';
  }
}

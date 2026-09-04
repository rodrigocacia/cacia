import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { CLIENTE_OPENAI } from '../cliente-openai';
import { MessageSender } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { MemoriaService } from './memoria.service';

/** A partir de quantas mensagens novas o resumo é refeito. */
const MENSAGENS_ATE_RESUMIR = 10;
/** Teto do resumo, para que ele não cresça sem limite ao longo dos meses. */
const MAX_PALAVRAS_RESUMO = 200;

const INSTRUCAO = `Você resume conversas de atendimento de um escritório de advocacia.

Produza um resumo em português, com no máximo ${MAX_PALAVRAS_RESUMO} palavras, que
preserve:

- o que a pessoa procura e em que situação está
- decisões tomadas e compromissos assumidos de parte a parte
- dados concretos mencionados: números de processo, valores, prazos, nomes
- o que ficou pendente

Não inclua saudações, agradecimentos nem cortesias. Escreva em terceira pessoa,
de forma corrida. Se receber um resumo anterior, incorpore-o em vez de repeti-lo:
o resultado substitui o anterior por completo.`;

/**
 * Mantém o resumo rolante de cada conversa.
 *
 * É a camada morna da memória: o que já saiu da janela quente vira resumo, em
 * vez de desaparecer. No sistema anterior, mensagem fora da janela de 20 era
 * perdida em definitivo.
 */
@Injectable()
export class SumarizacaoService {
  private readonly logger = new Logger(SumarizacaoService.name);
  private readonly modelo: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly memoria: MemoriaService,
    @Inject(CLIENTE_OPENAI) private readonly openai: OpenAI,
    config: ConfigService,
  ) {
    // Sumarização é tarefa simples e frequente: usa o modelo barato, não o
    // mesmo do atendimento.
    this.modelo = config.get<string>('OPENAI_SUMMARY_MODEL') ?? 'gpt-4o-mini';
  }

  /**
   * Refaz o resumo se houver mensagens novas suficientes.
   *
   * Devolve false quando não havia o que fazer — o worker usa isso para não
   * registrar trabalho inexistente.
   */
  async atualizarSeNecessario(
    officeId: string,
    chatId: string,
  ): Promise<boolean> {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, officeId, deletedAt: null },
      select: {
        summary: true,
        summarizedMessageCount: true,
        _count: { select: { messages: true } },
      },
    });

    if (!chat) return false;

    const naoResumidas = chat._count.messages - chat.summarizedMessageCount;

    if (naoResumidas < MENSAGENS_ATE_RESUMIR) return false;

    const mensagens = await this.prisma.message.findMany({
      where: { chatId, officeId, deletedAt: null },
      select: { sender: true, messageText: true, messageCaption: true },
      orderBy: { createdAt: 'asc' },
      skip: chat.summarizedMessageCount,
      take: naoResumidas,
    });

    const transcricao = mensagens
      .map((m) => {
        const quem = m.sender === MessageSender.AGENT ? 'Atendente' : 'Cliente';
        const texto = m.messageText ?? m.messageCaption ?? '[mídia]';
        return `${quem}: ${texto}`;
      })
      .join('\n');

    if (transcricao.trim().length === 0) return false;

    try {
      const resumo = await this.resumir(chat.summary, transcricao);

      await this.memoria.gravarResumo(
        officeId,
        chatId,
        resumo,
        chat._count.messages,
      );

      this.logger.log(
        `Resumo da conversa ${chatId} atualizado (${naoResumidas} mensagens novas)`,
      );

      return true;
    } catch (erro) {
      // Falhar aqui não quebra o atendimento: o agente segue com a camada
      // quente e os fatos. O resumo será tentado de novo no próximo ciclo.
      this.logger.error(
        `Falha ao resumir a conversa ${chatId}: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
      return false;
    }
  }

  private async resumir(
    resumoAnterior: string | null,
    transcricao: string,
  ): Promise<string> {
    const entrada = resumoAnterior
      ? `Resumo anterior:\n${resumoAnterior}\n\nMensagens novas:\n${transcricao}`
      : `Mensagens da conversa:\n${transcricao}`;

    const resposta = await this.openai.chat.completions.create({
      model: this.modelo,
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        { role: 'system', content: INSTRUCAO },
        { role: 'user', content: entrada },
      ],
    });

    const texto = resposta.choices[0]?.message.content?.trim();

    if (!texto) throw new Error('O modelo não devolveu resumo');

    return texto;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { MemoriaService } from '../memoria/memoria.service';
import {
  FerramentasService,
  type ContextoFerramenta,
} from '../ferramentas/ferramentas.service';
import { PromptService } from './prompt.service';

export interface PedidoAoAgente {
  officeId: string;
  chatId: string;
  mensagem: string;
  customerId?: string;
  leadId?: string;
}

export interface RespostaDoAgente {
  texto: string;
  ferramentasUsadas: string[];
  acionouAtendente: boolean;
}

/**
 * Teto de idas e voltas com ferramentas.
 *
 * Sem limite, um modelo confuso pode encadear chamadas indefinidamente,
 * consumindo tokens e deixando o cliente sem resposta.
 */
const MAX_RODADAS = 4;

@Injectable()
export class AgenteService {
  private readonly logger = new Logger(AgenteService.name);
  private readonly openai: OpenAI;
  private readonly modelo: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly memoria: MemoriaService,
    private readonly prompt: PromptService,
    private readonly ferramentas: FerramentasService,
    config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: config.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.modelo = config.get<string>('OPENAI_MODEL') ?? 'gpt-4o';
  }

  async responder(pedido: PedidoAoAgente): Promise<RespostaDoAgente> {
    const agente = await this.buscarAgente(pedido.officeId, pedido.chatId);

    const [blocoEstatico, contexto] = await Promise.all([
      this.prompt.blocoEstatico(pedido.officeId),
      this.memoria.montarContexto(
        pedido.officeId,
        pedido.chatId,
        pedido.mensagem,
      ),
    ]);

    // A ordem importa: o bloco estático vem primeiro e é idêntico entre
    // mensagens, o que habilita o desconto de cache de prefixo da OpenAI.
    const mensagens: ChatCompletionMessageParam[] = [
      { role: 'system', content: blocoEstatico },
      { role: 'system', content: this.prompt.blocoDeComportamento(agente) },
    ];

    const memoriaTexto = this.memoria.formatarParaPrompt(contexto);
    if (memoriaTexto) {
      mensagens.push({ role: 'system', content: memoriaTexto });
    }

    mensagens.push(...this.memoria.turnosComoMensagens(contexto));
    mensagens.push({ role: 'user', content: pedido.mensagem });

    const contextoFerramenta: ContextoFerramenta = {
      officeId: pedido.officeId,
      chatId: pedido.chatId,
      customerId: pedido.customerId,
      leadId: pedido.leadId,
    };

    const resposta = await this.executarLaco(
      mensagens,
      this.ferramentas.definicoes(),
      contextoFerramenta,
    );

    // Só o texto entra na memória — nunca as chamadas de ferramenta nem os
    // resultados delas. Era exatamente isso que consumia a janela antiga.
    await this.memoria.registrarTurno(pedido.chatId, {
      papel: 'user',
      conteudo: pedido.mensagem,
    });
    await this.memoria.registrarTurno(pedido.chatId, {
      papel: 'assistant',
      conteudo: resposta.texto,
    });

    return resposta;
  }

  /**
   * Laço de conversa com ferramentas.
   *
   * O histórico de chamadas fica LOCAL a esta execução: ele é necessário para
   * o modelo encadear as chamadas, mas não sobrevive à resposta.
   */
  private async executarLaco(
    mensagens: ChatCompletionMessageParam[],
    ferramentas: ChatCompletionTool[],
    contexto: ContextoFerramenta,
  ): Promise<RespostaDoAgente> {
    const usadas: string[] = [];
    let acionouAtendente = false;

    for (let rodada = 0; rodada < MAX_RODADAS; rodada++) {
      const resposta = await this.openai.chat.completions.create({
        model: this.modelo,
        temperature: 0.3,
        max_tokens: 800,
        messages: mensagens,
        tools: ferramentas,
      });

      const escolha = resposta.choices[0]?.message;
      if (!escolha) break;

      const chamadas = escolha.tool_calls ?? [];

      if (chamadas.length === 0) {
        return {
          texto: escolha.content?.trim() ?? this.respostaDeReserva(),
          ferramentasUsadas: usadas,
          acionouAtendente,
        };
      }

      mensagens.push(escolha);

      for (const chamada of chamadas) {
        if (chamada.type !== 'function') continue;

        usadas.push(chamada.function.name);
        if (chamada.function.name === 'acionar_atendente') {
          acionouAtendente = true;
        }

        const resultado = await this.ferramentas.executar(
          chamada.function.name,
          this.parsearArgumentos(chamada.function.arguments),
          contexto,
        );

        mensagens.push({
          role: 'tool',
          tool_call_id: chamada.id,
          content: resultado,
        });
      }
    }

    this.logger.warn(
      `Laço encerrado por limite de rodadas na conversa ${contexto.chatId}`,
    );

    return {
      texto: this.respostaDeReserva(),
      ferramentasUsadas: usadas,
      acionouAtendente,
    };
  }

  private parsearArgumentos(bruto: string): Record<string, unknown> {
    try {
      return JSON.parse(bruto) as Record<string, unknown>;
    } catch {
      // O modelo às vezes devolve JSON malformado; um objeto vazio faz a
      // ferramenta usar seus padrões, o que é melhor que derrubar a resposta.
      return {};
    }
  }

  private respostaDeReserva(): string {
    return (
      'Não consegui concluir agora. Vou pedir para alguém do escritório ' +
      'continuar seu atendimento.'
    );
  }

  private async buscarAgente(officeId: string, chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, officeId, deletedAt: null },
      select: {
        agent: { select: { name: true, style: true, greeting: true } },
      },
    });

    return (
      chat?.agent ?? {
        name: 'CacIA',
        style: 'Claro e Objetivo',
        greeting: 'Olá! Como posso ajudar?',
      }
    );
  }
}

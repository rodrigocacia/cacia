import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import { AiTask } from '@cacia/database';
import { CLIENTE_DEEPSEEK, CLIENTE_OPENAI } from './cliente-openai';
import {
  ConsumoDeIaService,
  type UsoDeIa,
} from './consumo/consumo-de-ia.service';

/**
 * O que está sendo pedido ao modelo. Cada tarefa pode usar um modelo
 * diferente no provedor principal.
 */
export type TarefaDeIa = 'atendimento' | 'resumo' | 'extracao';

export interface PedidoAoModelo {
  tarefa: TarefaDeIa;
  /** Escritório a quem o consumo é cobrado. */
  uso: UsoDeIa;
  messages: ChatCompletionMessageParam[];
  tools?: ChatCompletionTool[];
  temperatura: number;
  /** Tamanho máximo da resposta visível. */
  maxTokens: number;
  /** Exige resposta em JSON. */
  json?: boolean;
}

export type Provedor = 'deepseek' | 'openai';

export type RespostaDoModelo = ChatCompletion & { provedor: Provedor };

const TAREFA_NO_BANCO: Record<TarefaDeIa, AiTask> = {
  atendimento: AiTask.ATTENDANCE,
  resumo: AiTask.SUMMARY,
  extracao: AiTask.FACTS,
};

/**
 * O modelo de reserva raciocina antes de responder, e esse raciocínio sai do
 * mesmo limite de tokens da resposta. Com o limite pensado para o texto
 * visível, ele gastaria tudo pensando e devolveria resposta vazia.
 */
const FOLGA_PARA_RACIOCINIO = 4;
const MINIMO_COM_RACIOCINIO = 2000;

/**
 * Ponto único de acesso aos modelos de texto.
 *
 * DeepSeek é o principal. Qualquer falha dele (fora do ar, lento, sem saldo,
 * limite de uso) faz a MESMA requisição ir para a OpenAI, e o cliente no
 * WhatsApp recebe a resposta do mesmo jeito. Sem a chave da DeepSeek, tudo vai
 * direto para a OpenAI.
 *
 * Os serviços de IA não conhecem os provedores: pedem uma tarefa e recebem uma
 * resposta. Trocar de modelo é mudar variável de ambiente.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly modelosPrincipais: Record<TarefaDeIa, string>;
  private readonly modeloReserva: string;

  constructor(
    @Inject(CLIENTE_DEEPSEEK) private readonly deepseek: OpenAI | null,
    @Inject(CLIENTE_OPENAI) private readonly openai: OpenAI,
    private readonly consumo: ConsumoDeIaService,
    config: ConfigService,
  ) {
    const atendimento = config.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-chat';
    const resumo = config.get<string>('DEEPSEEK_SUMMARY_MODEL') ?? atendimento;

    this.modelosPrincipais = { atendimento, resumo, extracao: resumo };
    this.modeloReserva =
      config.get<string>('OPENAI_FALLBACK_MODEL') ?? 'gpt-5-mini';

    if (!this.deepseek) {
      this.logger.warn(
        'DEEPSEEK_API_KEY ausente: todo o texto vai para a OpenAI',
      );
    }
  }

  async completar(pedido: PedidoAoModelo): Promise<RespostaDoModelo> {
    if (this.deepseek) {
      try {
        const params = this.paramsPrincipal(pedido);
        const resposta = await this.deepseek.chat.completions.create(params);

        if (resposta.choices[0]?.message) {
          await this.registrar(pedido, 'deepseek', params.model, resposta);
          return { ...resposta, provedor: 'deepseek' };
        }

        this.logger.warn(
          `DeepSeek devolveu resposta sem conteúdo (${pedido.tarefa}); usando a reserva`,
        );
      } catch (erro) {
        this.logger.warn(
          `DeepSeek falhou (${pedido.tarefa}); usando a reserva: ${this.descrever(erro)}`,
        );
      }
    }

    const params = this.paramsReserva(pedido);
    const resposta = await this.openai.chat.completions.create(params);

    await this.registrar(pedido, 'openai', params.model, resposta, true);

    return { ...resposta, provedor: 'openai' };
  }

  /**
   * O cache de prefixo aparece com nomes diferentes: `cached_tokens` na
   * OpenAI, `prompt_cache_hit_tokens` na DeepSeek. Tokens em cache custam uma
   * fração do normal, então ignorá-los cobraria a mais.
   *
   * Na família GPT-5, `completion_tokens` já inclui o raciocínio, que é
   * cobrado como saída.
   */
  private registrar(
    pedido: PedidoAoModelo,
    provedor: Provedor,
    modelo: string,
    resposta: ChatCompletion,
    reserva = false,
  ): Promise<void> {
    const uso = resposta.usage as
      | (ChatCompletion['usage'] & { prompt_cache_hit_tokens?: number })
      | undefined;

    return this.consumo.registrar({
      ...pedido.uso,
      tarefa: TAREFA_NO_BANCO[pedido.tarefa],
      provedor,
      modelo,
      reserva: reserva && this.deepseek !== null,
      tokensEntrada: uso?.prompt_tokens ?? 0,
      tokensEmCache:
        uso?.prompt_tokens_details?.cached_tokens ??
        uso?.prompt_cache_hit_tokens ??
        0,
      tokensSaida: uso?.completion_tokens ?? 0,
    });
  }

  private paramsPrincipal(
    pedido: PedidoAoModelo,
  ): ChatCompletionCreateParamsNonStreaming {
    return {
      model: this.modelosPrincipais[pedido.tarefa],
      messages: pedido.messages,
      temperature: pedido.temperatura,
      max_tokens: pedido.maxTokens,
      ...(pedido.tools?.length && { tools: pedido.tools }),
      ...(pedido.json && { response_format: { type: 'json_object' } }),
    };
  }

  /**
   * A família GPT-5 é de raciocínio: não aceita `temperature` (só o padrão) e
   * troca `max_tokens` por `max_completion_tokens`. Mandar os parâmetros do
   * principal faria a reserva falhar justamente quando é necessária.
   */
  private paramsReserva(
    pedido: PedidoAoModelo,
  ): ChatCompletionCreateParamsNonStreaming {
    return {
      model: this.modeloReserva,
      messages: pedido.messages,
      max_completion_tokens: Math.max(
        pedido.maxTokens * FOLGA_PARA_RACIOCINIO,
        MINIMO_COM_RACIOCINIO,
      ),
      // Atendimento e resumo não pedem raciocínio longo; menos esforço é
      // resposta mais rápida e mais barata.
      reasoning_effort: 'low',
      ...(pedido.tools?.length && { tools: pedido.tools }),
      ...(pedido.json && { response_format: { type: 'json_object' } }),
    };
  }

  private descrever(erro: unknown): string {
    if (erro && typeof erro === 'object' && 'status' in erro) {
      const { status, message } = erro as { status?: number; message?: string };
      return `${status ?? '?'} ${message ?? ''}`.trim();
    }
    return erro instanceof Error ? erro.message : 'erro';
  }
}

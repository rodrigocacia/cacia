import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import type { ConsumoDeIaService } from './consumo/consumo-de-ia.service';
import { LlmService, type PedidoAoModelo } from './llm.service';

function resposta(texto: string, usage?: Record<string, unknown>) {
  return {
    usage: usage ?? { prompt_tokens: 100, completion_tokens: 20 },
    id: 'r',
    object: 'chat.completion',
    created: 0,
    model: 'm',
    choices: [
      {
        index: 0,
        finish_reason: 'stop',
        logprobs: null,
        message: { role: 'assistant', content: texto, refusal: null },
      },
    ],
  };
}

function cliente(create: ReturnType<typeof vi.fn>) {
  return { chat: { completions: { create } } } as unknown as OpenAI;
}

function montar(
  opcoes: {
    semDeepSeek?: boolean;
    deepseek?: ReturnType<typeof vi.fn>;
    variaveis?: Record<string, string>;
  } = {},
) {
  const deepseek =
    opcoes.deepseek ?? vi.fn().mockResolvedValue(resposta('da DeepSeek'));
  const openai = vi.fn().mockResolvedValue(resposta('da OpenAI'));

  const config = {
    get: vi.fn((chave: string) => opcoes.variaveis?.[chave]),
  } as unknown as ConfigService;

  const registrar = vi.fn().mockResolvedValue(undefined);
  const consumo = { registrar } as unknown as ConsumoDeIaService;

  return {
    llm: new LlmService(
      opcoes.semDeepSeek ? null : cliente(deepseek),
      cliente(openai),
      consumo,
      config,
    ),
    deepseek,
    openai,
    registrar,
  };
}

const PEDIDO: PedidoAoModelo = {
  tarefa: 'atendimento',
  uso: { officeId: 'escritorio-1', chatId: 'conversa-1' },
  messages: [{ role: 'user', content: 'Oi' }],
  temperatura: 0.3,
  maxTokens: 800,
};

function erroDaApi(status: number) {
  return Object.assign(new Error(`erro ${status}`), { status });
}

describe('LlmService', () => {
  describe('registro do consumo', () => {
    it('registra a chamada atendida, com o cache da DeepSeek', async () => {
      // O nome do campo de cache é diferente em cada provedor; ignorá-lo
      // cobraria como entrada cheia o que custou uma fração
      const { llm, registrar } = montar({
        deepseek: vi.fn().mockResolvedValue(
          resposta('ok', {
            prompt_tokens: 1000,
            completion_tokens: 50,
            prompt_cache_hit_tokens: 800,
          }),
        ),
      });

      await llm.completar(PEDIDO);

      expect(registrar).toHaveBeenCalledWith({
        officeId: 'escritorio-1',
        chatId: 'conversa-1',
        tarefa: 'ATTENDANCE',
        provedor: 'deepseek',
        modelo: 'deepseek-chat',
        reserva: false,
        tokensEntrada: 1000,
        tokensEmCache: 800,
        tokensSaida: 50,
      });
    });

    it('na reserva, registra só a chamada que respondeu, marcada como reserva', async () => {
      const { llm, registrar, openai } = montar({
        deepseek: vi.fn().mockRejectedValue(erroDaApi(503)),
      });
      openai.mockResolvedValueOnce(
        resposta('ok', {
          prompt_tokens: 1000,
          completion_tokens: 900,
          prompt_tokens_details: { cached_tokens: 512 },
        }),
      );

      await llm.completar({ ...PEDIDO, tarefa: 'resumo' });

      expect(registrar).toHaveBeenCalledOnce();
      expect(registrar.mock.calls[0]?.[0]).toMatchObject({
        tarefa: 'SUMMARY',
        provedor: 'openai',
        modelo: 'gpt-5-mini',
        reserva: true,
        tokensEmCache: 512,
        tokensSaida: 900,
      });
    });

    it('sem DeepSeek configurada, a OpenAI não conta como reserva', async () => {
      const { llm, registrar } = montar({ semDeepSeek: true });

      await llm.completar({ ...PEDIDO, tarefa: 'extracao' });

      expect(registrar.mock.calls[0]?.[0]).toMatchObject({
        tarefa: 'FACTS',
        reserva: false,
      });
    });
  });

  describe('provedor principal', () => {
    it('responde pela DeepSeek quando ela funciona', async () => {
      const { llm, deepseek, openai } = montar();

      const r = await llm.completar(PEDIDO);

      expect(r.provedor).toBe('deepseek');
      expect(r.choices[0]?.message.content).toBe('da DeepSeek');
      expect(openai).not.toHaveBeenCalled();
      expect(deepseek.mock.calls[0]?.[0]).toMatchObject({
        model: 'deepseek-chat',
        temperature: 0.3,
        max_tokens: 800,
      });
    });

    it('resumo e extração podem usar outro modelo', async () => {
      const { llm, deepseek } = montar({
        variaveis: { DEEPSEEK_SUMMARY_MODEL: 'modelo-de-resumo' },
      });

      await llm.completar({ ...PEDIDO, tarefa: 'resumo' });
      await llm.completar({ ...PEDIDO, tarefa: 'extracao', json: true });

      expect(deepseek.mock.calls[0]?.[0]).toMatchObject({
        model: 'modelo-de-resumo',
      });
      expect(deepseek.mock.calls[1]?.[0]).toMatchObject({
        model: 'modelo-de-resumo',
        response_format: { type: 'json_object' },
      });
    });

    it('não manda lista de ferramentas vazia', async () => {
      // Algumas APIs recusam `tools: []`
      const { llm, deepseek } = montar();

      await llm.completar({ ...PEDIDO, tools: [] });

      expect(deepseek.mock.calls[0]?.[0]).not.toHaveProperty('tools');
    });
  });

  describe('reserva na OpenAI', () => {
    const falhas = [
      { caso: 'fora do ar (503)', erro: erroDaApi(503) },
      { caso: 'sem saldo (402)', erro: erroDaApi(402) },
      { caso: 'limite de uso (429)', erro: erroDaApi(429) },
      { caso: 'tempo esgotado', erro: new Error('Request timed out.') },
    ];

    for (const { caso, erro } of falhas) {
      it(`assume quando a DeepSeek está ${caso}`, async () => {
        // O cliente no WhatsApp não pode ficar sem resposta por causa disso
        const { llm, openai } = montar({
          deepseek: vi.fn().mockRejectedValue(erro),
        });

        const r = await llm.completar(PEDIDO);

        expect(r.provedor).toBe('openai');
        expect(r.choices[0]?.message.content).toBe('da OpenAI');
        expect(openai).toHaveBeenCalledOnce();
      });
    }

    it('assume quando a DeepSeek devolve resposta sem mensagem', async () => {
      const { llm } = montar({
        deepseek: vi.fn().mockResolvedValue({ choices: [] }),
      });

      expect((await llm.completar(PEDIDO)).provedor).toBe('openai');
    });

    it('sem chave da DeepSeek, vai direto para a OpenAI', async () => {
      const { llm, openai } = montar({ semDeepSeek: true });

      expect((await llm.completar(PEDIDO)).provedor).toBe('openai');
      expect(openai).toHaveBeenCalledOnce();
    });

    it('usa gpt-5-mini, sem temperature e com folga para o raciocínio', async () => {
      // A família GPT-5 recusa `temperature` e `max_tokens`; mandar os mesmos
      // parâmetros do principal faria a reserva falhar quando mais importa.
      const { llm, openai } = montar({ semDeepSeek: true });

      await llm.completar({
        ...PEDIDO,
        tools: [
          {
            type: 'function',
            function: { name: 'consultar_agenda', parameters: {} },
          },
        ],
      });

      const params = openai.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(params.model).toBe('gpt-5-mini');
      expect(params).not.toHaveProperty('temperature');
      expect(params).not.toHaveProperty('max_tokens');
      expect(params.max_completion_tokens).toBe(3200);
      expect(params.tools).toHaveLength(1);
    });

    it('o modelo de reserva é configurável', async () => {
      const { llm, openai } = montar({
        semDeepSeek: true,
        variaveis: { OPENAI_FALLBACK_MODEL: 'outro-modelo' },
      });

      await llm.completar(PEDIDO);

      expect(openai.mock.calls[0]?.[0]).toMatchObject({
        model: 'outro-modelo',
      });
    });

    it('a falha da reserva chega a quem chamou', async () => {
      // Aí não há mais o que tentar: o atendimento usa a resposta de reserva
      // e aciona uma pessoa (ver AtendimentoProcessor)
      const { llm, openai } = montar({
        deepseek: vi.fn().mockRejectedValue(erroDaApi(503)),
      });
      openai.mockRejectedValueOnce(erroDaApi(500));

      await expect(llm.completar(PEDIDO)).rejects.toThrow('erro 500');
    });
  });
});

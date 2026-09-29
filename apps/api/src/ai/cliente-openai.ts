import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * O cliente da OpenAI, um só para toda a aplicação.
 *
 * Antes cada serviço criava o seu: quatro clientes, quatro pools de conexão,
 * a mesma chave repetida. E, o que pesa mais no dia a dia, nenhum deles podia
 * ser substituído em teste — a instância nascia dentro do construtor, então
 * verificar o laço de ferramentas do agente exigiria chamar a API de verdade.
 *
 * Serve às embeddings (a DeepSeek não tem esse serviço) e à reserva do texto
 * (ver LlmService).
 */
export const CLIENTE_OPENAI = Symbol('CLIENTE_OPENAI');

export const provedorOpenAI: Provider = {
  provide: CLIENTE_OPENAI,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    new OpenAI({ apiKey: config.getOrThrow<string>('OPENAI_API_KEY') }),
};

/**
 * O cliente da DeepSeek, provedor principal de texto.
 *
 * A API da DeepSeek segue o formato da OpenAI, então o mesmo SDK serve,
 * apontado para outro endereço. Sem chave configurada o provedor é `null` e
 * todo o texto vai direto para a reserva.
 *
 * Tempo curto e uma única nova tentativa de propósito: o padrão do SDK espera
 * até 10 minutos e tenta três vezes, e o cliente no WhatsApp ficaria esse tempo
 * todo sem resposta antes de a reserva sequer ser acionada.
 */
export const CLIENTE_DEEPSEEK = Symbol('CLIENTE_DEEPSEEK');

export const provedorDeepSeek: Provider = {
  provide: CLIENTE_DEEPSEEK,
  inject: [ConfigService],
  useFactory: (config: ConfigService): OpenAI | null => {
    const apiKey = config.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) return null;

    return new OpenAI({
      apiKey,
      baseURL:
        config.get<string>('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com',
      timeout: 45_000,
      maxRetries: 1,
    });
  },
};

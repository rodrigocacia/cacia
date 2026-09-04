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
 */
export const CLIENTE_OPENAI = Symbol('CLIENTE_OPENAI');

export const provedorOpenAI: Provider = {
  provide: CLIENTE_OPENAI,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    new OpenAI({ apiKey: config.getOrThrow<string>('OPENAI_API_KEY') }),
};

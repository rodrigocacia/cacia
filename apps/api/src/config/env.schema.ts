import { z } from 'zod';

/**
 * Validação das variáveis de ambiente.
 *
 * A aplicação recusa subir se algo obrigatório faltar. É deliberado: variável
 * ausente com valor padrão silencioso foi um problema real na arquitetura
 * anterior — 25 das 72 variáveis não estavam documentadas, e a ausência delas
 * só aparecia quando o usuário tentava usar a funcionalidade.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  WEBSITE_URL: z.string().url(),
  APP_WEBHOOK_URL: z.string().url(),

  // Autenticação
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET precisa de ao menos 32 caracteres'),
  JWT_EXPIRATION_TIME: z.string().default('7d'),

  // Banco de dados
  DATABASE_URL: z.string().startsWith('postgresql://'),

  // Redis — filas e memória de curto prazo
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
  REDIS_TLS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  REDIS_PREFIX: z.string().default('cacia:'),

  // WhatsApp — opcionais para que a API suba sem eles em desenvolvimento.
  // A ausência é registrada em log e a funcionalidade recusa operar, em vez
  // de impedir a aplicação inteira de iniciar.
  WAHA_API_URL: z.string().url().optional(),
  WAHA_API_KEY: z.string().optional(),

  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().optional(),

  // Proxy residencial. Sem isso, as sessões saem pelo IP do datacenter.
  EVOMI_API_KEY: z.string().optional(),
  EVOMI_PRODUCT: z.enum(['rp', 'rpc']).default('rpc'),

  // Token compartilhado que autentica os webhooks. Obrigatório: sem ele,
  // qualquer um poderia injetar mensagens falsas no atendimento.
  CACIA_TOOL_API_KEY: z
    .string()
    .min(24, 'CACIA_TOOL_API_KEY precisa de ao menos 24 caracteres'),

  // Inteligência artificial — texto: DeepSeek principal, OpenAI de reserva
  // (ver LlmService). Sem a chave da DeepSeek, todo o texto vai para a OpenAI.
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().url().default('https://api.deepseek.com'),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),
  // Resumo e extração de fatos; sem valor, usa o mesmo do atendimento
  DEEPSEEK_SUMMARY_MODEL: z.string().optional(),
  // A OpenAI continua obrigatória: embeddings (a DeepSeek não tem) e reserva
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  OPENAI_FALLBACK_MODEL: z.string().default('gpt-5-mini'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  OPENAI_EMBEDDING_DIMENSIONS: z.coerce.number().int().default(1536),

  // Busca vetorial — RAG de documentos e camada fria da memória
  QDRANT_URL: z.string().url(),
  QDRANT_API_KEY: z.string().optional(),
  QDRANT_COLLECTION: z.string().default('cacia_vectors'),

  // Limite de requisições por IP
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),

  // Rastreamento de erros. Sem DSN, o Sentry fica inativo.
  SENTRY_DSN: z.string().url().optional(),

  // Dados processuais. Sem a chave, o acompanhamento fica inativo e os
  // processos são cadastrados sem monitoramento.
  JUDIT_API_URL: z.string().url().default('https://requests.prod.judit.io'),
  JUDIT_API_KEY: z.string().optional(),

  // Armazenamento de arquivos, compatível com S3 — Cloudflare R2 em
  // produção, S3 local no docker compose. Substitui a prática anterior de guardar base64 na
  // linha da tabela.
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_BUCKET: z.string(),
  STORAGE_ACCESS_KEY_ID: z.string(),
  STORAGE_SECRET_ACCESS_KEY: z.string(),
  STORAGE_REGION: z.string().default('auto'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const problemas = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');

    throw new Error(
      `Configuração de ambiente inválida:\n${problemas}\n\n` +
        `Consulte o .env.example na raiz do repositório.`,
    );
  }

  return result.data;
}

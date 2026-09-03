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

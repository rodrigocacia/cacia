/**
 * Variáveis de ambiente dos testes de ponta a ponta.
 *
 * Carregado pelo `setupFiles` do Vitest, antes de qualquer import da
 * aplicação: o `ConfigModule.forRoot()` valida o ambiente no momento em que o
 * `app.module.ts` é importado, não quando a aplicação sobe.
 *
 * Os valores das integrações externas são fictícios de propósito. Nenhum
 * teste daqui deve alcançar a rede — os serviços que fariam isso são
 * substituídos por dublês (ver dubles.ts). Se algum escapar, a chamada falha
 * com uma URL inexistente em vez de gastar crédito de API de verdade.
 */

/** Banco e prefixo separados: o E2E apaga tabelas e chaves entre os testes. */
const POSTGRES_PADRAO =
  'postgresql://cacia:cacia@localhost:5434/cacia?schema=e2e';

/**
 * A conexão do E2E, com precedência própria.
 *
 * `DATABASE_URL_E2E` vence a `DATABASE_URL` de propósito: quem está com a
 * aplicação aberta ao lado costuma ter a segunda exportada apontando para o
 * banco de desenvolvimento, e a suíte trunca as tabelas que encontrar.
 */
const conexao =
  process.env.DATABASE_URL_E2E ?? process.env.DATABASE_URL ?? POSTGRES_PADRAO;

const schema = new URL(conexao).searchParams.get('schema');

if (schema === null || schema === 'public') {
  throw new Error(
    'Os testes de ponta a ponta apagam todas as tabelas do schema em que ' +
      'rodam. Aponte DATABASE_URL_E2E para um schema dedicado — por exemplo ' +
      `${POSTGRES_PADRAO} — em vez de "${schema ?? 'nenhum'}".`,
  );
}

const PADROES: Record<string, string> = {
  NODE_ENV: 'test',
  // Não é usada: o harness chama `listen(0)` e o sistema operacional escolhe
  // a porta, para que várias suítes possam subir ao mesmo tempo. Está aqui
  // só porque o schema de ambiente exige a variável.
  PORT: '3000',

  REDIS_HOST: 'localhost',
  // 6380 é a porta do Redis do docker compose; quem roda um Redis nativo na
  // máquina aponta REDIS_PORT_E2E para ele.
  REDIS_PORT: process.env.REDIS_PORT_E2E ?? '6380',
  // Banco 15 e prefixo próprio: um `flushdb` acidental não leva o
  // desenvolvimento junto.
  REDIS_DB: '15',
  REDIS_PREFIX: 'cacia-e2e:',

  WEBSITE_URL: 'http://localhost:3001',
  APP_WEBHOOK_URL: 'http://localhost:3000',

  JWT_SECRET: 'segredo-de-teste-com-mais-de-32-caracteres-aqui',
  JWT_EXPIRATION_TIME: '1h',
  CACIA_TOOL_API_KEY: 'token-de-webhook-de-teste-com-24-mais',

  OPENAI_API_KEY: 'sk-teste',
  QDRANT_URL: 'http://localhost:9',

  STORAGE_ENDPOINT: 'http://localhost:9',
  STORAGE_BUCKET: 'cacia-teste',
  STORAGE_ACCESS_KEY_ID: 'chave',
  STORAGE_SECRET_ACCESS_KEY: 'segredo',

  // Alto de propósito: a suíte faz centenas de requisições do mesmo IP, e o
  // limite existe contra abuso, não contra teste. O comportamento do limite
  // tem teste próprio, que sobe a aplicação com um teto baixo.
  RATE_LIMIT_MAX: '100000',
};

for (const [chave, valor] of Object.entries(PADROES)) {
  process.env[chave] ??= valor;
}

// Fora do laço: esta não é um padrão, é a decisão já tomada acima
process.env.DATABASE_URL = conexao;

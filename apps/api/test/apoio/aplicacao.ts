import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';
import { StorageService } from '@/infra/storage/storage.service';
import { QdrantService } from '@/integrations/qdrant/qdrant.service';
import { WahaService } from '@/integrations/waha/waha.service';
import { EvolutionService } from '@/integrations/evolution/evolution.service';
import { EvomiService } from '@/integrations/evomi/evomi.service';
import { JuditService } from '@/integrations/judit/judit.service';
import { EmbeddingsService } from '@/ai/embeddings.service';
import { AgenteService } from '@/ai/agente/agente.service';
import { configurarApp } from '@/bootstrap';
import {
  AgenteFalso,
  EmbeddingsFalsa,
  EvolutionFalso,
  EvomiFalso,
  JuditFalso,
  QdrantEmMemoria,
  StorageEmMemoria,
  WahaFalso,
} from './dubles';

export interface AplicacaoDeTeste {
  app: INestApplication;
  /** Endereço HTTP real — os testes falam com a aplicação por socket. */
  url: string;
  prisma: PrismaService;
  qdrant: QdrantEmMemoria;
  storage: StorageEmMemoria;
  waha: WahaFalso;
  judit: JuditFalso;
  encerrar: () => Promise<void>;
}

/**
 * Sobe a aplicação inteira, ouvindo em porta efêmera.
 *
 * É a aplicação de verdade: os mesmos módulos, os mesmos guards globais, a
 * mesma configuração do `main.ts` — só as integrações que sairiam para a rede
 * são trocadas. O banco e o Redis são reais, porque é exatamente onde moram
 * os defeitos que o teste unitário com Prisma dublado não enxerga: uma query
 * inválida, um índice único que dispara, um enum que não existe.
 */
export async function criarAplicacao(
  ambiente: Record<string, string> = {},
): Promise<AplicacaoDeTeste> {
  for (const [chave, valor] of Object.entries(ambiente)) {
    process.env[chave] = valor;
  }

  // Import dinâmico: o ConfigModule valida o ambiente no momento em que o
  // app.module é carregado, então os ajustes acima precisam vir antes.
  const { AppModule } = await import('@/app.module');

  const qdrant = new QdrantEmMemoria();
  const storage = new StorageEmMemoria();
  const waha = new WahaFalso();
  const judit = new JuditFalso();

  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(QdrantService)
    .useValue(qdrant)
    .overrideProvider(StorageService)
    .useValue(storage)
    .overrideProvider(WahaService)
    .useValue(waha)
    .overrideProvider(EvolutionService)
    .useValue(new EvolutionFalso())
    .overrideProvider(EvomiService)
    .useValue(new EvomiFalso())
    .overrideProvider(JuditService)
    .useValue(judit)
    .overrideProvider(EmbeddingsService)
    .useValue(new EmbeddingsFalsa())
    .overrideProvider(AgenteService)
    .useValue(new AgenteFalso())
    .compile();

  const app = modulo.createNestApplication();

  configurarApp(app, app.get(ConfigService));

  await app.init();
  await app.listen(0, '127.0.0.1');

  const endereco = app.getHttpServer().address() as AddressInfo;
  const prisma = app.get(PrismaService);
  const redis = app.get(RedisService);

  await limparBanco(prisma);
  await redis.client.flushdb();

  return {
    app,
    url: `http://127.0.0.1:${endereco.port}`,
    prisma,
    qdrant,
    storage,
    waha,
    judit,
    encerrar: async () => {
      await limparBanco(prisma);
      await redis.client.flushdb();
      await app.close();
    },
  };
}

/**
 * Esvazia as tabelas entre os testes.
 *
 * `TRUNCATE ... CASCADE` em vez de apagar em ordem de dependência: a ordem
 * mudaria a cada tabela nova, e uma ordem errada falha com mensagem que não
 * ajuda ninguém. As tabelas são descobertas no catálogo, não listadas à mão,
 * pelo mesmo motivo.
 */
export async function limparBanco(prisma: PrismaService): Promise<void> {
  const esquema = esquemaDaConexao();

  const tabelas = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = $1`,
    esquema,
  );

  const alvos = tabelas
    .map((t) => t.tablename)
    .filter((nome) => nome !== '_prisma_migrations')
    .map((nome) => `"${esquema}"."${nome}"`);

  if (alvos.length === 0) return;

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${alvos.join(', ')} RESTART IDENTITY CASCADE`,
  );
}

/** O schema vem da própria DATABASE_URL — o E2E usa um separado do dev. */
function esquemaDaConexao(): string {
  const url = process.env.DATABASE_URL ?? '';
  return new URL(url).searchParams.get('schema') ?? 'public';
}

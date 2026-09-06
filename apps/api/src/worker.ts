import 'reflect-metadata';
import { resolve } from 'node:path';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { validateEnv } from './config/env.schema';
import { PrismaModule } from './infra/prisma/prisma.module';
import { RedisModule } from './infra/redis/redis.module';
import { WorkerModule } from './worker/worker.module';

/**
 * Raiz do processo worker.
 *
 * Deliberadamente NÃO é o AppModule: o worker não expõe rota nem guard, e
 * carregar os controllers aqui criaria um segundo servidor HTTP sem ninguém
 * apontando para ele.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
      // Mesmo `.env` da API, na raiz do monorepo — ver app.module.ts
      envFilePath: ['.env', resolve(__dirname, '../../../.env')],
    }),
    PrismaModule,
    RedisModule,
    WorkerModule,
  ],
})
class WorkerRootModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerRootModule);
  const logger = new Logger('Worker');

  app.enableShutdownHooks();

  logger.log('Worker iniciado — consumindo filas e tarefas agendadas');
}

void bootstrap();

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Entrypoint do worker.
 *
 * Mesmo código da API, sem servidor HTTP: processa filas e tarefas agendadas.
 * A separação existe para que uma chamada de LLM ou o processamento de um
 * áudio longo não segure as requisições dos usuários.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Worker');

  app.enableShutdownHooks();

  logger.log('Worker iniciado — consumindo filas');
}

void bootstrap();

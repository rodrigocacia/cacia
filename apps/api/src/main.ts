// O Sentry precisa instrumentar os módulos ao serem carregados, então vem
// antes de qualquer import da aplicação.
import { iniciarSentry } from './infra/observabilidade/sentry';

iniciarSentry();

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configurarApp } from './bootstrap';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('API');

  // A mesma configuração que os testes de ponta a ponta aplicam — ver
  // bootstrap.ts
  configurarApp(app, config);

  // Documentação apenas fora de produção: em produção ela expõe a superfície
  // inteira da API para quem quiser mapeá-la.
  if (config.get<string>('NODE_ENV') !== 'production') {
    const documento = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('CacIA')
        .setDescription(
          'API da plataforma. Rotas de escritório exigem o cabeçalho x-office-id.',
        )
        .setVersion('1.0')
        .addBearerAuth()
        .addGlobalParameters({
          name: 'x-office-id',
          in: 'header',
          required: false,
          description: 'Escritório da requisição',
        })
        .build(),
    );

    SwaggerModule.setup('docs', app, documento);
    logger.log('Documentação disponível em /docs');
  }

  const porta = config.getOrThrow<number>('PORT');
  await app.listen(porta, '0.0.0.0');

  logger.log(`API ouvindo na porta ${porta}`);
}

void bootstrap();

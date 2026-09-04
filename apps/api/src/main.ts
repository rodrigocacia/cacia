// O Sentry precisa instrumentar os módulos ao serem carregados, então vem
// antes de qualquer import da aplicação.
import { iniciarSentry } from './infra/observabilidade/sentry';

iniciarSentry();

import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('API');

  app.use(helmet());

  app.enableCors({
    origin: config.getOrThrow<string>('WEBSITE_URL'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos não declarados no DTO
      forbidNonWhitelisted: true, // e recusa a requisição que os envie
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Encerra as conexões de banco e Redis antes de o processo morrer
  app.enableShutdownHooks();

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

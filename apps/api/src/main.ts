import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
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

  const porta = config.getOrThrow<number>('PORT');
  await app.listen(porta, '0.0.0.0');

  logger.log(`API ouvindo na porta ${porta}`);
}

void bootstrap();

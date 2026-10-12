import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

/**
 * Configuração da aplicação — pipes, CORS, cabeçalhos de segurança.
 *
 * Vive aqui, e não no `main.ts`, porque os testes de ponta a ponta sobem a
 * mesma aplicação. Se a validação fosse montada só no `main.ts`, o teste
 * exercitaria uma aplicação MENOS restritiva que a de produção: campo extra
 * passaria no teste e seria recusado em produção, ou pior, o contrário.
 */
export function configurarApp(
  app: INestApplication,
  config: ConfigService,
): void {
  app.use(helmet());

  app.enableCors({
    origin: [
      config.getOrThrow<string>('WEBSITE_URL'),
      config.get<string>('BACKOFFICE_URL'),
    ].filter((origem): origem is string => Boolean(origem)),
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
}

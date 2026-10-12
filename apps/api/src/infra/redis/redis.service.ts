import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis({
      host: config.getOrThrow<string>('REDIS_HOST'),
      port: config.getOrThrow<number>('REDIS_PORT'),
      username: config.get<string>('REDIS_USERNAME'),
      password: config.get<string>('REDIS_PASSWORD'),
      db: config.getOrThrow<number>('REDIS_DB'),
      tls: config.get<boolean>('REDIS_TLS') ? {} : undefined,
      keyPrefix: config.get<string>('REDIS_PREFIX'),
      // O ioredis resolve só IPv4 por padrão; a rede privada do Fly
      // (*.internal) é só IPv6.
      family: 0,
      maxRetriesPerRequest: 3,
      retryStrategy: (tentativas) => Math.min(tentativas * 100, 3000),
    });

    this.client.on('connect', () => this.logger.log('Conectado ao Redis'));
    this.client.on('error', (erro) =>
      this.logger.error(`Redis: ${erro.message}`),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}

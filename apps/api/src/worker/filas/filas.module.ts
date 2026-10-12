import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FILA } from './filas';

/**
 * Conexão e registro das filas.
 *
 * Carregado pelos DOIS processos: a API publica, o worker consome. Aqui não
 * há processador nenhum — quem os registra é o WorkerModule, que só entra no
 * processo do worker.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: config.getOrThrow<number>('REDIS_PORT'),
          username: config.get<string>('REDIS_USERNAME'),
          password: config.get<string>('REDIS_PASSWORD'),
          db: config.getOrThrow<number>('REDIS_DB'),
          // Ver RedisService: *.internal no Fly é só IPv6
          family: 0,
          ...(config.get<boolean>('REDIS_TLS') && { tls: {} }),
        },
        prefix: config.get<string>('REDIS_PREFIX'),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          // Guarda os últimos concluídos para inspeção, e mais dos que
          // falharam — é neles que se investiga o que deu errado.
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: FILA.ATENDIMENTO },
      { name: FILA.ENVIO_WHATSAPP },
      { name: FILA.LEMBRETES },
      { name: FILA.INDEXACAO_DOCUMENTO },
      { name: FILA.ACOMPANHAMENTO_PROCESSO },
      { name: FILA.IMPORTACAO_LEADS },
    ),
  ],
  exports: [BullModule],
})
export class FilasModule {}

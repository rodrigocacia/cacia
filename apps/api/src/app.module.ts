import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.schema';
import { PrismaModule } from './infra/prisma/prisma.module';
import { RedisModule } from './infra/redis/redis.module';
import { HealthModule } from './infra/health/health.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TenantGuard } from './auth/guards/tenant.guard';
import { OfficeRoleGuard } from './auth/guards/office-role.guard';
import { UsersModule } from './modules/users/users.module';
import { OfficesModule } from './modules/offices/offices.module';
import { PlansModule } from './modules/plans/plans.module';
import { CustomersModule } from './modules/customers/customers.module';
import { LeadsModule } from './modules/leads/leads.module';
import { ProcessesModule } from './modules/processes/processes.module';
import { CalendarsModule } from './modules/calendars/calendars.module';
import { EventsModule } from './modules/events/events.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { AgentsModule } from './modules/agents/agents.module';
import { ChatsModule } from './modules/chats/chats.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { FilasModule } from './worker/filas/filas.module';
import { IaModule } from './ai/ia.module';
import { ObservabilidadeModule } from './infra/observabilidade/observabilidade.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
    }),
    // Limite por IP. Não protege contra ataque distribuído, mas impede que um
    // cliente com laço de repetição derrube a API para todo mundo.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_LIMIT_TTL') ?? 60_000,
          limit: config.get<number>('RATE_LIMIT_MAX') ?? 120,
        },
      ],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    HealthModule,
    UsersModule,
    OfficesModule,
    PlansModule,
    CustomersModule,
    LeadsModule,
    ProcessesModule,
    CalendarsModule,
    EventsModule,
    RemindersModule,
    ConnectionsModule,
    AgentsModule,
    ChatsModule,
    WebhooksModule,
    FilasModule,
    IaModule,
    ObservabilidadeModule,
  ],
  providers: [
    // Ambos globais e nesta ordem: autentica, depois resolve o escritório.
    // Aplicar por padrão em vez de por rota significa que esquecer o guard
    // não é possível — o que é preciso declarar é a EXCEÇÃO.
    // O limite vem antes da autenticação: uma enxurrada de requisições sem
    // token não pode custar uma consulta ao banco cada.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: OfficeRoleGuard },
  ],
})
export class AppModule {}

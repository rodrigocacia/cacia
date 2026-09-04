import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
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
  ],
  providers: [
    // Ambos globais e nesta ordem: autentica, depois resolve o escritório.
    // Aplicar por padrão em vez de por rota significa que esquecer o guard
    // não é possível — o que é preciso declarar é a EXCEÇÃO.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: OfficeRoleGuard },
  ],
})
export class AppModule {}

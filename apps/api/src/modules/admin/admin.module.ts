import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { IaModule } from '@/ai/ia.module';
import { AiUsageModule } from '@/modules/ai-usage/ai-usage.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  // AuthModule pelo SenhaService: cadastrar um escritório cria o dono dele.
  // IaModule pelo PromptService: editar o escritório invalida o prompt.
  // AiUsageModule pelo relatório de consumo: é daqui que se cobra a IA.
  imports: [AuthModule, IaModule, AiUsageModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

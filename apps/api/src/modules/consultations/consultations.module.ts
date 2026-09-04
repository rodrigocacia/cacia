import { Module } from '@nestjs/common';
import { IaModule } from '@/ai/ia.module';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';

@Module({
  // Pelo PromptService: o valor da consulta entra no prompt do agente.
  imports: [IaModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}

import { Module } from '@nestjs/common';
import { EvomiService } from './evomi/evomi.service';
import { WahaService } from './waha/waha.service';
import { EvolutionService } from './evolution/evolution.service';
import { JuditService } from './judit/judit.service';

/** Clientes das APIs externas. Sem lógica de negócio — só o contrato HTTP. */
@Module({
  providers: [EvomiService, WahaService, EvolutionService, JuditService],
  exports: [EvomiService, WahaService, EvolutionService, JuditService],
})
export class IntegracoesModule {}

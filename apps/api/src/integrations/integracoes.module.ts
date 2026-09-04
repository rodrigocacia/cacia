import { Module } from '@nestjs/common';
import { EvomiService } from './evomi/evomi.service';
import { WahaService } from './waha/waha.service';
import { EvolutionService } from './evolution/evolution.service';

/** Clientes das APIs externas. Sem lógica de negócio — só o contrato HTTP. */
@Module({
  providers: [EvomiService, WahaService, EvolutionService],
  exports: [EvomiService, WahaService, EvolutionService],
})
export class IntegracoesModule {}

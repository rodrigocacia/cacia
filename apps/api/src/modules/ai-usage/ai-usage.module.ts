import { Module } from '@nestjs/common';
import { IaModule } from '@/ai/ia.module';
import { AiUsageController } from './ai-usage.controller';
import { RelatorioDeConsumoService } from './relatorio-de-consumo.service';

/**
 * Relatório de consumo de IA, base da cobrança dos escritórios.
 *
 * O registro de cada chamada fica na camada de IA (ConsumoDeIaService); aqui
 * só se lê e se consolida.
 */
@Module({
  imports: [IaModule],
  controllers: [AiUsageController],
  providers: [RelatorioDeConsumoService],
  exports: [RelatorioDeConsumoService],
})
export class AiUsageModule {}

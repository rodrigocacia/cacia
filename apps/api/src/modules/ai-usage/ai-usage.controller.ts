import { Controller, Get, Query } from '@nestjs/common';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { PeriodoDeConsumoDto } from './dto/ai-usage.dto';
import { RelatorioDeConsumoService } from './relatorio-de-consumo.service';

/**
 * Consumo de IA do próprio escritório, no valor cobrado. Sem datas, é o mês
 * corrente.
 */
@Controller('ai-usage')
export class AiUsageController {
  constructor(private readonly relatorio: RelatorioDeConsumoService) {}

  @Get()
  consumo(
    @CurrentOffice() officeId: string,
    @Query() dto: PeriodoDeConsumoDto,
  ) {
    return this.relatorio.doEscritorio(officeId, dto.from, dto.to);
  }
}

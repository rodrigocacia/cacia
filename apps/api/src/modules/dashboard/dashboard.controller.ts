import { Controller, Get, Query } from '@nestjs/common';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { DashboardService } from './dashboard.service';
import { InicioService } from './inicio.service';
import { InicioDto, ResumoDto } from './dto/dashboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly inicio: InicioService,
  ) {}

  /** A tela de Início: madrugada, quem espera, o dia e o período. */
  @Get('home')
  telaInicial(@CurrentOffice() officeId: string, @Query() dto: InicioDto) {
    return this.inicio.montar(officeId, dto.periodo);
  }

  @Get()
  resumo(@CurrentOffice() officeId: string, @Query() dto: ResumoDto) {
    return this.dashboard.resumo(officeId, {
      de: dto.from ? new Date(dto.from) : undefined,
      ate: dto.to ? new Date(dto.to) : undefined,
    });
  }
}

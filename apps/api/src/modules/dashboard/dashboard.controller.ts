import { Controller, Get, Query } from '@nestjs/common';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { DashboardService } from './dashboard.service';
import { ResumoDto } from './dto/dashboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  resumo(@CurrentOffice() officeId: string, @Query() dto: ResumoDto) {
    return this.dashboard.resumo(officeId, {
      de: dto.from ? new Date(dto.from) : undefined,
      ate: dto.to ? new Date(dto.to) : undefined,
    });
  }
}

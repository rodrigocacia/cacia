import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { InicioService } from './inicio.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, InicioService],
  exports: [DashboardService],
})
export class DashboardModule {}

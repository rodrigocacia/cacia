import { Module } from '@nestjs/common';
import { IaModule } from '@/ai/ia.module';
import { CalendarsController } from './calendars.controller';
import { CalendarsService } from './calendars.service';
import { DisponibilidadeService } from './disponibilidade.service';

@Module({
  // Pelo PromptService: mudar a agenda precisa invalidar o cache do prompt
  imports: [IaModule],
  controllers: [CalendarsController],
  providers: [CalendarsService, DisponibilidadeService],
  exports: [CalendarsService, DisponibilidadeService],
})
export class CalendarsModule {}

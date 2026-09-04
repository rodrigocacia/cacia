import { Module } from '@nestjs/common';
import { IaModule } from '@/ai/ia.module';
import { CalendarsController } from './calendars.controller';
import { CalendarsService } from './calendars.service';

@Module({
  // Pelo PromptService: mudar a agenda precisa invalidar o cache do prompt
  imports: [IaModule],
  controllers: [CalendarsController],
  providers: [CalendarsService],
  exports: [CalendarsService],
})
export class CalendarsModule {}

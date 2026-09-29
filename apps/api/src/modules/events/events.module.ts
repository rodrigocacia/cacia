import { Module } from '@nestjs/common';
import { CalendarsModule } from '../calendars/calendars.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  // CalendarsModule pela disponibilidade: marcar compromisso sem olhar a
  // agenda foi o que permitiu dois no mesmo horário.
  imports: [CalendarsModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}

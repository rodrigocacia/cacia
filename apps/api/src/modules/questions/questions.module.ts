import { Module } from '@nestjs/common';
import { IaModule } from '@/ai/ia.module';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  // Pelo PromptService: as perguntas frequentes entram no prompt do agente.
  imports: [IaModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}

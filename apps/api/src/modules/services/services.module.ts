import { Module } from '@nestjs/common';
import { IaModule } from '@/ai/ia.module';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  // Pelo PromptService: os serviços entram no prompt do agente, e alterá-los
  // precisa invalidar o cache do bloco estático.
  imports: [IaModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}

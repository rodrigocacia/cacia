import { Module } from '@nestjs/common';
import { IaModule } from '@/ai/ia.module';
import { OfficesController } from './offices.controller';
import { OfficesService } from './offices.service';

@Module({
  // Pelo PromptService: mudar o escritório precisa invalidar o cache do prompt
  imports: [IaModule],
  controllers: [OfficesController],
  providers: [OfficesService],
  exports: [OfficesService],
})
export class OfficesModule {}

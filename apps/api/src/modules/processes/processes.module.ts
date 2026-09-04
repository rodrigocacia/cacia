import { Module } from '@nestjs/common';
import { IntegracoesModule } from '@/integrations/integracoes.module';
import { ProcessesController } from './processes.controller';
import { ProcessesService } from './processes.service';

@Module({
  imports: [IntegracoesModule],
  controllers: [ProcessesController],
  providers: [ProcessesService],
  exports: [ProcessesService],
})
export class ProcessesModule {}

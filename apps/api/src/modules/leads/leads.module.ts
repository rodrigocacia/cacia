import { Module } from '@nestjs/common';
import { PipelinesModule } from '../pipelines/pipelines.module';
import { TagsModule } from '../tags/tags.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [PipelinesModule, TagsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}

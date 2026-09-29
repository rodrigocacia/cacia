import { Module } from '@nestjs/common';
import { StorageModule } from '@/infra/storage/storage.module';
import { FilasModule } from '@/worker/filas/filas.module';
import { PipelinesModule } from '../pipelines/pipelines.module';
import { TagsModule } from '../tags/tags.module';
import { LeadImportsController } from './lead-imports.controller';
import { LeadImportsService } from './lead-imports.service';

@Module({
  imports: [StorageModule, FilasModule, PipelinesModule, TagsModule],
  controllers: [LeadImportsController],
  providers: [LeadImportsService],
  exports: [LeadImportsService],
})
export class LeadImportsModule {}

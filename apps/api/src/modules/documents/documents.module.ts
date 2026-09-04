import { Module } from '@nestjs/common';
import { IaModule } from '@/ai/ia.module';
import { StorageModule } from '@/infra/storage/storage.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [StorageModule, IaModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

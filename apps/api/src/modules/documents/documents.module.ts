import { Module } from '@nestjs/common';
import { IaModule } from '@/ai/ia.module';
import { StorageModule } from '@/infra/storage/storage.module';
import { FilasModule } from '@/worker/filas/filas.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  // FilasModule pela fila de indexação: ler o arquivo e gerar os embeddings
  // leva segundos, e a requisição de upload não pode esperar por isso.
  imports: [StorageModule, IaModule, FilasModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

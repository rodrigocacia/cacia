import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { DocumentsService } from '@/modules/documents/documents.service';
import { FILA, type JobIndexacaoDocumento } from '../filas/filas';

/**
 * Lê o documento e o indexa para busca semântica.
 *
 * Fora da requisição de upload: extrair o texto de um PDF e gerar os
 * embeddings leva segundos, e quem enviou o arquivo não pode esperar.
 *
 * O serviço já grava o resultado — COMPLETED, SKIPPED ou FAILED com a
 * mensagem do erro. Aqui o que importa é deixar a falha subir: o BullMQ
 * repete com espera crescente, o que resolve o caso mais comum, que é a
 * indisponibilidade momentânea do storage ou da API de embeddings.
 */
@Processor(FILA.INDEXACAO_DOCUMENTO)
export class IndexacaoDocumentoProcessor extends WorkerHost {
  private readonly logger = new Logger(IndexacaoDocumentoProcessor.name);

  constructor(private readonly documents: DocumentsService) {
    super();
  }

  async process(job: Job<JobIndexacaoDocumento>): Promise<{ trechos: number }> {
    const { officeId, documentId } = job.data;

    const trechos = await this.documents.indexar(officeId, documentId);

    this.logger.log(`Documento ${documentId} indexado em ${trechos} trecho(s)`);

    return { trechos };
  }
}

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Queue } from 'bullmq';
import { DocumentsService } from '@/modules/documents/documents.service';
import { FILA, type JobIndexacaoDocumento } from '../filas/filas';

/**
 * Rede de segurança da indexação.
 *
 * O caminho normal é o upload enfileirar direto. Esta varredura existe para o
 * que escapa dele: um Redis fora do ar no momento do envio, um worker que
 * morreu com o job na mão, documentos criados antes de a indexação existir.
 *
 * O `jobId` derivado do documento torna o reenfileiramento inofensivo — o
 * BullMQ descarta a duplicata em vez de indexar duas vezes.
 */
@Injectable()
export class IndexacaoTarefa {
  private readonly logger = new Logger(IndexacaoTarefa.name);
  private executando = false;

  constructor(
    private readonly documents: DocumentsService,
    @InjectQueue(FILA.INDEXACAO_DOCUMENTO)
    private readonly fila: Queue<JobIndexacaoDocumento>,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES, { name: 'varrer-indexacao' })
  async varrer(): Promise<void> {
    if (this.executando) return;

    this.executando = true;

    try {
      const pendentes = await this.documents.listarPendentesDeIndexacao();

      if (pendentes.length === 0) return;

      this.logger.log(`${pendentes.length} documento(s) aguardando indexação`);

      await this.fila.addBulk(
        pendentes.map((documento) => ({
          name: 'indexar',
          data: { officeId: documento.officeId, documentId: documento.id },
          opts: {
            jobId: `documento-${documento.id}`,
            attempts: 3,
            backoff: { type: 'exponential' as const, delay: 10_000 },
            removeOnComplete: true,
            removeOnFail: 200,
          },
        })),
      );
    } catch (erro) {
      this.logger.error(
        `Falha na varredura de indexação: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
    } finally {
      this.executando = false;
    }
  }
}

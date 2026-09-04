import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { ProcessesService } from '@/modules/processes/processes.service';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { FILA, type JobAcompanhamentoProcesso } from '../filas/filas';

/**
 * Tenta de novo ativar o acompanhamento contínuo na Judit.
 *
 * O cadastro do processo não é desfeito quando a Judit está fora do ar — mas,
 * sem esta nova tentativa, o processo ficaria sem monitoramento para sempre,
 * parecendo apenas um processo sem movimentação. Era o comportamento do
 * sistema anterior, e é o que o produto existe para evitar.
 */
@Processor(FILA.ACOMPANHAMENTO_PROCESSO)
export class AcompanhamentoProcessoProcessor extends WorkerHost {
  private readonly logger = new Logger(AcompanhamentoProcessoProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly processes: ProcessesService,
  ) {
    super();
  }

  async process(
    job: Job<JobAcompanhamentoProcesso>,
  ): Promise<{ ativado: boolean }> {
    const { officeId, processId, numero } = job.data;

    await this.processes.ativarAcompanhamento(officeId, processId, numero);

    // O serviço não lança: ele grava ERROR e segue. A confirmação é a
    // presença do tracking, não a ausência de exceção.
    const processo = await this.prisma.process.findFirst({
      where: { id: processId, officeId },
      select: { juditTrackingId: true },
    });

    const ativado = Boolean(processo?.juditTrackingId);

    if (ativado) {
      this.logger.log(`Acompanhamento do processo ${numero} retomado`);
    }

    return { ativado };
  }
}

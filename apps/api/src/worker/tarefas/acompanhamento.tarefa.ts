import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Queue } from 'bullmq';
import { ProcessesService } from '@/modules/processes/processes.service';
import { FILA, type JobAcompanhamentoProcesso } from '../filas/filas';

/**
 * Retoma os acompanhamentos que falharam ao cadastrar o processo.
 *
 * De hora em hora, e não a cada minuto: a causa quase sempre é a Judit fora do
 * ar, e insistir de minuto em minuto só gastaria a cota da API sem aumentar a
 * chance de sucesso.
 *
 * Sem isto, um processo cadastrado durante uma instabilidade ficaria sem
 * monitoramento para sempre — visível apenas para quem abrisse a tela de
 * processos sem acompanhamento.
 */
@Injectable()
export class AcompanhamentoTarefa {
  private readonly logger = new Logger(AcompanhamentoTarefa.name);
  private executando = false;

  constructor(
    private readonly processes: ProcessesService,
    @InjectQueue(FILA.ACOMPANHAMENTO_PROCESSO)
    private readonly fila: Queue<JobAcompanhamentoProcesso>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, { name: 'retomar-acompanhamentos' })
  async varrer(): Promise<void> {
    if (this.executando) return;

    this.executando = true;

    try {
      const pendentes = await this.processes.listarParaRetomarAcompanhamento();

      if (pendentes.length === 0) return;

      this.logger.log(
        `${pendentes.length} processo(s) sem acompanhamento; tentando de novo`,
      );

      await this.fila.addBulk(
        pendentes.map((processo) => ({
          name: 'ativar',
          data: {
            officeId: processo.officeId,
            processId: processo.id,
            numero: processo.number,
          },
          opts: {
            jobId: `acompanhamento-${processo.id}`,
            attempts: 2,
            backoff: { type: 'exponential' as const, delay: 60_000 },
            removeOnComplete: true,
            removeOnFail: 200,
          },
        })),
      );
    } catch (erro) {
      this.logger.error(
        `Falha na varredura de acompanhamentos: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
    } finally {
      this.executando = false;
    }
  }
}

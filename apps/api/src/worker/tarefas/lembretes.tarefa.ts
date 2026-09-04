import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Queue } from 'bullmq';
import { RemindersService } from '@/modules/reminders/reminders.service';
import { FILA, type JobLembrete } from '../filas/filas';

/**
 * Varre os lembretes vencidos e enfileira o envio.
 *
 * A varredura roda a cada minuto, mas a corretude não depende disso: como a
 * busca não tem janela de tempo, um ciclo perdido apenas atrasa o aviso. No
 * sistema anterior, um ciclo perdido significava lembrete perdido em definitivo.
 */
@Injectable()
export class LembretesTarefa {
  private readonly logger = new Logger(LembretesTarefa.name);
  private executando = false;

  constructor(
    private readonly reminders: RemindersService,
    @InjectQueue(FILA.LEMBRETES) private readonly fila: Queue<JobLembrete>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'varrer-lembretes' })
  async varrer(): Promise<void> {
    // Uma varredura lenta não pode acumular com a próxima: duas rodadas
    // simultâneas competiriam pelos mesmos lembretes. A reserva atômica já
    // impediria o envio duplicado, mas evitar o trabalho é melhor.
    if (this.executando) {
      this.logger.warn('Varredura anterior ainda em curso; pulando este ciclo');
      return;
    }

    this.executando = true;

    try {
      const pendentes = await this.reminders.buscarPendentes();

      if (pendentes.length === 0) return;

      this.logger.log(`${pendentes.length} lembrete(s) vencido(s)`);

      await this.fila.addBulk(
        pendentes.map((lembrete) => ({
          name: 'enviar',
          data: {
            reminderId: lembrete.id,
            tentativaAtual: lembrete.retryCount,
          },
          opts: {
            // O id do lembrete como jobId torna o enfileiramento idempotente:
            // se a varredura repetir antes do processamento, o BullMQ descarta
            // a duplicata em vez de criar um segundo job.
            jobId: `lembrete-${lembrete.id}`,
            removeOnComplete: true,
            removeOnFail: 100,
          },
        })),
      );
    } catch (erro) {
      this.logger.error(
        `Falha na varredura de lembretes: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
    } finally {
      this.executando = false;
    }
  }
}

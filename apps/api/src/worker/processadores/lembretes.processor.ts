import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { MessageType, WhatsappProvider } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RemindersService } from '@/modules/reminders/reminders.service';
import { FILA, type JobEnvioWhatsapp, type JobLembrete } from '../filas/filas';

/**
 * Envia um lembrete pelo WhatsApp.
 *
 * A ordem aqui é deliberada e corrige a falha do sistema anterior:
 * reserva primeiro, envia depois, confirma por último. Se o processo cair no
 * meio, o lembrete fica em PROCESSING e não é reenviado por engano.
 */
@Processor(FILA.LEMBRETES)
export class LembretesProcessor extends WorkerHost {
  private readonly logger = new Logger(LembretesProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reminders: RemindersService,
    @InjectQueue(FILA.ENVIO_WHATSAPP)
    private readonly envio: Queue<JobEnvioWhatsapp>,
  ) {
    super();
  }

  async process(job: Job<JobLembrete>): Promise<{ enviado: boolean }> {
    const { reminderId, tentativaAtual } = job.data;

    // Reserva ANTES de enviar. Dois workers que peguem o mesmo lembrete
    // disputam esta troca, e só um recebe true.
    const reservou = await this.reminders.reservar(reminderId);

    if (!reservou) {
      this.logger.log(`Lembrete ${reminderId} já reservado por outro worker`);
      return { enviado: false };
    }

    try {
      const destino = await this.montarDestino(reminderId);

      if (!destino) {
        // Sem destinatário não há o que reenviar; falhar de vez evita o
        // lembrete circular entre tentativas para sempre.
        await this.reminders.marcarFalha(
          reminderId,
          2,
          'Lembrete sem contato com WhatsApp associado',
        );
        return { enviado: false };
      }

      await this.envio.add('enviar', destino, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      });

      await this.reminders.marcarEnviado(reminderId);

      return { enviado: true };
    } catch (erro) {
      await this.reminders.marcarFalha(
        reminderId,
        tentativaAtual,
        erro instanceof Error ? erro.message : 'erro desconhecido',
      );
      throw erro;
    }
  }

  private async montarDestino(
    reminderId: string,
  ): Promise<JobEnvioWhatsapp | null> {
    const lembrete = await this.prisma.reminder.findUnique({
      where: { id: reminderId },
      select: {
        officeId: true,
        title: true,
        description: true,
        event: { select: { title: true, startTime: true } },
        customer: { select: { remotejid: true } },
        lead: { select: { remotejid: true } },
      },
    });

    if (!lembrete) return null;

    const para =
      lembrete.customer?.remotejid ?? lembrete.lead?.remotejid ?? null;

    if (!para) return null;

    const conexao = await this.prisma.connection.findFirst({
      where: {
        officeId: lembrete.officeId,
        provider: WhatsappProvider.WAHA,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!conexao) return null;

    return {
      officeId: lembrete.officeId,
      connectionId: conexao.id,
      para,
      tipo: MessageType.TEXT,
      texto: this.montarTexto(lembrete),
    };
  }

  private montarTexto(lembrete: {
    title: string;
    description: string | null;
    event: { title: string; startTime: Date } | null;
  }): string {
    const linhas = [`🔔 *${lembrete.title}*`];

    if (lembrete.event) {
      const quando = lembrete.event.startTime.toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
      });
      linhas.push(`\n📅 ${quando}`);
    }

    if (lembrete.description) linhas.push(`\n${lembrete.description}`);

    return linhas.join('\n');
  }
}

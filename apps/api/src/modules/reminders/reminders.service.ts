import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ReminderStatus, ReminderType } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import type { CriarLembreteDto } from './dto/reminder.dto';

const MAX_TENTATIVAS = 3;

export interface LembretePendente {
  id: string;
  officeId: string;
  userId: string;
  title: string;
  description: string | null;
  triggerAt: Date;
  retryCount: number;
  event: { id: string; title: string; startTime: Date } | null;
  customer: { id: string; name: string; remotejid: string } | null;
  lead: { id: string; name: string; remotejid: string } | null;
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca lembretes vencidos e ainda não enviados.
   *
   * A implementação anterior filtrava `trigger_at` entre agora e 5 minutos
   * atrás. Qualquer indisponibilidade nessa janela — um deploy, um restart —
   * fazia o lembrete envelhecer para fora do intervalo e ele NUNCA mais era
   * encontrado. Ficava `pending` para sempre, sem nenhum alerta.
   *
   * Aqui não há janela: tudo que venceu e continua pendente é elegível. Um
   * atraso atrasa o aviso; não o perde.
   *
   * Sem filtro por escritório de propósito — o worker varre todos os tenants.
   * É a única consulta do sistema que faz isso, e o índice
   * (status, trigger_at) existe exatamente para ela.
   */
  buscarPendentes(limite = 100): Promise<LembretePendente[]> {
    return this.prisma.reminder.findMany({
      where: {
        status: ReminderStatus.PENDING,
        triggerAt: { lte: new Date() },
        deletedAt: null,
        retryCount: { lt: MAX_TENTATIVAS },
      },
      select: {
        id: true,
        officeId: true,
        userId: true,
        title: true,
        description: true,
        triggerAt: true,
        retryCount: true,
        event: { select: { id: true, title: true, startTime: true } },
        customer: { select: { id: true, name: true, remotejid: true } },
        lead: { select: { id: true, name: true, remotejid: true } },
      },
      orderBy: { triggerAt: 'asc' },
      take: limite,
    });
  }

  /**
   * Reserva o lembrete para envio.
   *
   * `updateMany` com `status: PENDING` no where é uma troca atômica: se dois
   * workers pegarem o mesmo lembrete, apenas um recebe count 1 e envia. A
   * implementação anterior enviava primeiro e marcava depois — uma queda entre
   * as duas operações reenviava a mensagem ao cliente.
   */
  async reservar(id: string): Promise<boolean> {
    const { count } = await this.prisma.reminder.updateMany({
      where: { id, status: ReminderStatus.PENDING },
      data: { status: ReminderStatus.PROCESSING },
    });

    return count === 1;
  }

  /** Confirma o envio. O status vira SENT — não PROCESSING, como antes. */
  async marcarEnviado(id: string): Promise<void> {
    await this.prisma.reminder.update({
      where: { id },
      data: { status: ReminderStatus.SENT, sentAt: new Date() },
    });
  }

  /**
   * Registra a falha e decide se ainda cabe nova tentativa.
   *
   * Volta para PENDING enquanto houver tentativa: como a busca não tem janela
   * de tempo, o lembrete será reencontrado no próximo ciclo.
   */
  async marcarFalha(
    id: string,
    tentativaAtual: number,
    erro: string,
  ): Promise<void> {
    const tentativas = tentativaAtual + 1;
    const esgotou = tentativas >= MAX_TENTATIVAS;

    await this.prisma.reminder.update({
      where: { id },
      data: {
        status: esgotou ? ReminderStatus.FAILED : ReminderStatus.PENDING,
        retryCount: tentativas,
        errorMessage: erro.slice(0, 500),
      },
    });

    if (esgotou) {
      this.logger.error(
        `Lembrete ${id} descartado após ${MAX_TENTATIVAS} tentativas: ${erro}`,
      );
    }
  }

  /**
   * Lembretes que falharam em definitivo.
   *
   * Existe para que a falha seja visível: no sistema anterior um lembrete
   * perdido não aparecia em lugar nenhum.
   */
  listarFalhados(officeId: string) {
    return this.prisma.reminder.findMany({
      where: { officeId, status: ReminderStatus.FAILED, deletedAt: null },
      select: {
        id: true,
        title: true,
        triggerAt: true,
        errorMessage: true,
        retryCount: true,
        event: { select: { id: true, title: true, startTime: true } },
      },
      orderBy: { triggerAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Lembretes de um compromisso.
   *
   * A tela do evento mostra os avisos já programados para ele; sem esta rota,
   * quem abrisse o compromisso não teria como saber que já havia um.
   */
  listarDoEvento(officeId: string, eventId: string) {
    return this.prisma.reminder.findMany({
      where: { officeId, eventId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        timeTrigger: true,
        triggerAt: true,
        status: true,
        sentAt: true,
        createdAt: true,
      },
      orderBy: { timeTrigger: 'asc' },
    });
  }

  /**
   * Cria um lembrete para um compromisso que já existe.
   *
   * O horário de disparo é calculado a partir do início do evento — nunca
   * recebido pronto. Aceitar `triggerAt` do cliente permitiria um aviso
   * desalinhado do compromisso a que ele pertence.
   */
  async criar(officeId: string, userId: string, dto: CriarLembreteDto) {
    const evento = await this.prisma.event.findFirst({
      where: { id: dto.eventId, officeId, deletedAt: null },
      select: {
        id: true,
        startTime: true,
        customerId: true,
        leadId: true,
        processId: true,
      },
    });

    if (!evento) throw new NotFoundException('Compromisso não encontrado');

    const triggerAt = new Date(
      evento.startTime.getTime() - dto.timeTrigger * 60_000,
    );

    return this.prisma.reminder.create({
      data: {
        officeId,
        userId,
        eventId: evento.id,
        customerId: evento.customerId,
        leadId: evento.leadId,
        processId: evento.processId,
        type: ReminderType.EVENT,
        title: dto.title,
        description: dto.description,
        timeTrigger: dto.timeTrigger,
        triggerAt,
      },
      select: {
        id: true,
        title: true,
        description: true,
        timeTrigger: true,
        triggerAt: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async cancelar(officeId: string, id: string): Promise<void> {
    const lembrete = await this.prisma.reminder.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { id: true },
    });

    if (!lembrete) throw new NotFoundException('Lembrete não encontrado');

    await this.prisma.reminder.update({
      where: { id },
      data: { status: ReminderStatus.CANCELLED },
    });
  }
}

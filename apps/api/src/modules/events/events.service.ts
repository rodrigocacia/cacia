import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus, ReminderType } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import type {
  AtualizarEventoDto,
  CriarEventoDto,
  ListarEventosDto,
} from './dto/event.dto';

const CAMPOS = {
  id: true,
  title: true,
  description: true,
  type: true,
  status: true,
  consultationMode: true,
  startTime: true,
  endTime: true,
  reminderOffsets: true,
  calendarId: true,
  customerId: true,
  leadId: true,
  processId: true,
  createdAt: true,
} as const;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(officeId: string, dto: ListarEventosDto) {
    const where = {
      officeId,
      deletedAt: null,
      ...(dto.status && { status: dto.status }),
      ...(dto.calendarId && { calendarId: dto.calendarId }),
      ...(dto.customerId && { customerId: dto.customerId }),
      ...((dto.from ?? dto.to) && {
        startTime: {
          ...(dto.from && { gte: new Date(dto.from) }),
          ...(dto.to && { lte: new Date(dto.to) }),
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        select: {
          ...CAMPOS,
          customer: { select: { id: true, name: true } },
          lead: { select: { id: true, name: true } },
        },
        orderBy: { startTime: 'asc' },
        ...janela(dto),
      }),
      this.prisma.event.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
  }

  async detalhar(officeId: string, id: string) {
    const evento = await this.prisma.event.findFirst({
      where: { id, officeId, deletedAt: null },
      select: {
        ...CAMPOS,
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
        process: { select: { id: true, number: true } },
        reminders: {
          select: {
            id: true,
            triggerAt: true,
            status: true,
            sentAt: true,
            timeTrigger: true,
          },
          orderBy: { triggerAt: 'asc' },
        },
      },
    });

    if (!evento) throw new NotFoundException('Compromisso não encontrado');

    return evento;
  }

  /**
   * Cria o compromisso e os lembretes correspondentes na mesma transação.
   *
   * `reminderOffsets` traz as antecedências em minutos. Um compromisso salvo
   * sem os lembretes é pior que nenhum compromisso: o advogado confia que será
   * avisado e não é.
   */
  async criar(officeId: string, userId: string, dto: CriarEventoDto) {
    const inicio = new Date(dto.startTime);
    const fim = new Date(dto.endTime);

    if (fim <= inicio) {
      throw new BadRequestException('O término precisa ser depois do início');
    }

    await this.garantirAgenda(officeId, dto.calendarId);

    const offsets = dto.reminderOffsets ?? [];

    return this.prisma.$transaction(async (tx) => {
      const evento = await tx.event.create({
        data: {
          officeId,
          calendarId: dto.calendarId,
          customerId: dto.customerId,
          leadId: dto.leadId,
          processId: dto.processId,
          type: dto.type,
          title: dto.title,
          description: dto.description,
          startTime: inicio,
          endTime: fim,
          consultationMode: dto.consultationMode,
          reminderOffsets: offsets,
        },
        select: CAMPOS,
      });

      if (offsets.length) {
        await tx.reminder.createMany({
          data: offsets.map((minutos) => ({
            officeId,
            userId,
            eventId: evento.id,
            customerId: dto.customerId,
            leadId: dto.leadId,
            processId: dto.processId,
            type: ReminderType.EVENT,
            title: dto.title,
            description: dto.description,
            timeTrigger: minutos,
            triggerAt: new Date(inicio.getTime() - minutos * 60_000),
          })),
        });
      }

      return evento;
    });
  }

  /**
   * Atualiza o compromisso.
   *
   * Se o horário mudar, os lembretes ainda pendentes são recalculados — deixá-los
   * no horário antigo avisaria sobre um compromisso que já foi remarcado.
   */
  async atualizar(officeId: string, id: string, dto: AtualizarEventoDto) {
    const atual = await this.prisma.event.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { id: true, startTime: true, reminderOffsets: true },
    });

    if (!atual) throw new NotFoundException('Compromisso não encontrado');

    const novoInicio = dto.startTime ? new Date(dto.startTime) : null;
    const novoFim = dto.endTime ? new Date(dto.endTime) : null;

    if (novoInicio && novoFim && novoFim <= novoInicio) {
      throw new BadRequestException('O término precisa ser depois do início');
    }

    return this.prisma.$transaction(async (tx) => {
      const evento = await tx.event.update({
        where: { id },
        data: {
          ...dto,
          ...(novoInicio && { startTime: novoInicio }),
          ...(novoFim && { endTime: novoFim }),
        },
        select: CAMPOS,
      });

      if (novoInicio && novoInicio.getTime() !== atual.startTime.getTime()) {
        const pendentes = await tx.reminder.findMany({
          where: { eventId: id, officeId, status: 'PENDING' },
          select: { id: true, timeTrigger: true },
        });

        for (const lembrete of pendentes) {
          await tx.reminder.update({
            where: { id: lembrete.id },
            data: {
              triggerAt: new Date(
                novoInicio.getTime() - lembrete.timeTrigger * 60_000,
              ),
            },
          });
        }
      }

      return evento;
    });
  }

  /**
   * Cancela o compromisso.
   *
   * Cancela também os lembretes pendentes: avisar sobre audiência cancelada é
   * pior do que não avisar.
   */
  async cancelar(officeId: string, id: string) {
    await this.garantirQueExiste(officeId, id);

    return this.prisma.$transaction(async (tx) => {
      await tx.reminder.updateMany({
        where: { eventId: id, officeId, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      return tx.event.update({
        where: { id },
        data: { status: EventStatus.CANCEL },
        select: CAMPOS,
      });
    });
  }

  async remover(officeId: string, id: string): Promise<void> {
    await this.garantirQueExiste(officeId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.reminder.updateMany({
        where: { eventId: id, officeId, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      await tx.event.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }

  private async garantirAgenda(
    officeId: string,
    calendarId: string,
  ): Promise<void> {
    const agenda = await this.prisma.calendar.findFirst({
      where: { id: calendarId, officeId, deletedAt: null },
      select: { id: true },
    });

    if (!agenda) throw new NotFoundException('Agenda não encontrada');
  }

  private async garantirQueExiste(officeId: string, id: string): Promise<void> {
    const existe = await this.prisma.event.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { id: true },
    });

    if (!existe) throw new NotFoundException('Compromisso não encontrado');
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus, EventType, ReminderType } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import { DisponibilidadeService } from '../calendars/disponibilidade.service';
import { dentroDoExpediente, TIPOS_DE_ATENDIMENTO } from './expediente';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly disponibilidade: DisponibilidadeService,
  ) {}

  /**
   * Recusa marcar por cima de um compromisso que já existe.
   *
   * A agenda tinha dias e turnos configurados desde o começo e ninguém os
   * consultava: dava para marcar dois atendimentos no mesmo horário, e os dois
   * eram aceitos. Quem descobria era o cliente, na porta.
   *
   * `permitirConflito` existe porque nem toda sobreposição é erro — um prazo
   * processual e uma reunião podem coincidir de propósito. O que não pode é
   * acontecer sem ninguém ter dito que tudo bem.
   */
  private async recusarConflito(
    officeId: string,
    calendarId: string,
    inicio: Date,
    fim: Date,
    permitirConflito?: boolean,
    ignorarEventoId?: string,
  ): Promise<void> {
    if (permitirConflito) return;

    const existente = await this.disponibilidade.conflito(
      officeId,
      calendarId,
      inicio,
      fim,
      ignorarEventoId,
    );

    if (!existente) return;

    const quando = existente.startTime.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    });

    throw new ConflictException({
      message: `Já existe "${existente.title}" nesta agenda em ${quando}`,
      eventId: existente.id,
    });
  }

  /**
   * Recusa atendimento marcado fora dos turnos configurados na agenda.
   *
   * Só checar conflito deixava passar uma reunião às três da manhã de domingo
   * — a agenda livre, afinal. `permitirConflito` também libera aqui pelo mesmo
   * motivo: o advogado que decide atender fora do horário precisa conseguir
   * registrar isso, só não pode acontecer sem ele ter dito.
   *
   * Agenda sem nenhum dia configurado não restringe: ninguém disse qual é o
   * expediente, e recusar tudo tornaria a agenda inútil até alguém configurar.
   */
  private async recusarForaDoExpediente(
    calendarId: string,
    tipo: EventType | undefined,
    inicio: Date,
    fim: Date,
    permitirConflito?: boolean,
  ): Promise<void> {
    if (permitirConflito || !tipo || !TIPOS_DE_ATENDIMENTO.has(tipo)) return;

    const dias = await this.prisma.calendarAvailableDay.findMany({
      where: { calendarId },
      select: {
        day: true,
        available: true,
        startTime: true,
        endTime: true,
        shift2Available: true,
        shift2StartTime: true,
        shift2EndTime: true,
      },
    });

    if (dias.length === 0 || dentroDoExpediente(inicio, fim, dias)) return;

    throw new ConflictException({
      message: 'Fora do horário de atendimento da agenda',
      foraDoExpediente: true,
    });
  }

  /**
   * Cliente, lead e processo precisam ser deste escritório.
   *
   * O banco já recusa pela chave composta, mas como erro 500 — a tela mostrava
   * "erro interno" para o que é só um id que não existe aqui.
   */
  private async garantirVinculos(
    officeId: string,
    vinculos: { customerId?: string; leadId?: string; processId?: string },
  ): Promise<void> {
    const [cliente, lead, processo] = await Promise.all([
      vinculos.customerId
        ? this.prisma.customer.findFirst({
            where: { id: vinculos.customerId, officeId, deletedAt: null },
            select: { id: true },
          })
        : true,
      vinculos.leadId
        ? this.prisma.lead.findFirst({
            where: { id: vinculos.leadId, officeId, deletedAt: null },
            select: { id: true },
          })
        : true,
      vinculos.processId
        ? this.prisma.process.findFirst({
            where: { id: vinculos.processId, officeId, deletedAt: null },
            select: { id: true },
          })
        : true,
    ]);

    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    if (!lead) throw new NotFoundException('Lead não encontrado');
    if (!processo) throw new NotFoundException('Processo não encontrado');
  }

  async listar(officeId: string, dto: ListarEventosDto) {
    const where = {
      officeId,
      deletedAt: null,
      ...(dto.status && { status: dto.status }),
      ...(dto.calendarId && { calendarId: dto.calendarId }),
      ...(dto.customerId && { customerId: dto.customerId }),
      ...(dto.leadId && { leadId: dto.leadId }),
      ...(dto.processId && { processId: dto.processId }),
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
    await this.garantirVinculos(officeId, dto);

    await this.recusarForaDoExpediente(
      dto.calendarId,
      dto.type,
      inicio,
      fim,
      dto.permitirConflito,
    );

    await this.recusarConflito(
      officeId,
      dto.calendarId,
      inicio,
      fim,
      dto.permitirConflito,
    );

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
      select: {
        id: true,
        calendarId: true,
        type: true,
        startTime: true,
        endTime: true,
        reminderOffsets: true,
      },
    });

    if (!atual) throw new NotFoundException('Compromisso não encontrado');

    const novoInicio = dto.startTime ? new Date(dto.startTime) : null;
    const novoFim = dto.endTime ? new Date(dto.endTime) : null;

    // Cada ponta cai no valor atual quando só a outra mudou: comparar o novo
    // início com o fim ANTIGO é o que precisa ser validado, e não só o par
    // quando os dois vêm juntos.
    const inicioFinal = novoInicio ?? atual.startTime;
    const fimFinal = novoFim ?? atual.endTime;

    if (fimFinal <= inicioFinal) {
      throw new BadRequestException('O término precisa ser depois do início');
    }

    // Mudar só o tipo também conta: uma anotação no domingo que vira reunião
    // passa a ocupar um horário em que a agenda não atende.
    if (novoInicio || novoFim || (dto.type && dto.type !== atual.type)) {
      await this.recusarForaDoExpediente(
        atual.calendarId,
        dto.type ?? atual.type,
        inicioFinal,
        fimFinal,
        dto.permitirConflito,
      );
    }

    if (novoInicio || novoFim) {
      await this.recusarConflito(
        officeId,
        atual.calendarId,
        inicioFinal,
        fimFinal,
        dto.permitirConflito,
        // Ignora a si mesmo: sem isto, remarcar um compromisso para o mesmo
        // horário colidiria com ele próprio.
        id,
      );
    }

    // `permitirConflito` não é coluna: fica de fora do que vai para o Prisma.
    const { permitirConflito: _permitirConflito, ...campos } = dto;

    return this.prisma.$transaction(async (tx) => {
      const evento = await tx.event.update({
        where: { id },
        data: {
          ...campos,
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

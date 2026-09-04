import { Injectable, NotFoundException } from '@nestjs/common';
import { Weekday } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PromptService } from '@/ai/agente/prompt.service';
import type { AtualizarAgendaDto, CriarAgendaDto } from './dto/calendar.dto';

const CAMPOS = {
  id: true,
  title: true,
  description: true,
  generalRoles: true,
  generalAvailable: true,
  cancelRoles: true,
  notification: true,
  status: true,
  userId: true,
  createdAt: true,
} as const;

/** Ordem da semana para exibição — o enum do banco não garante ordenação. */
const ORDEM_SEMANA: Weekday[] = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
  Weekday.SUNDAY,
];

@Injectable()
export class CalendarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prompt: PromptService,
  ) {}

  /**
   * A agenda faz parte do bloco estático do prompt, que fica 15 minutos em
   * cache. Sem invalidar, o agente seguiria oferecendo o horário antigo
   * durante todo esse tempo — e quem mudou a agenda não teria como saber.
   */
  private invalidarPrompt(officeId: string): Promise<void> {
    return this.prompt.invalidar(officeId);
  }

  async listar(officeId: string) {
    const agendas = await this.prisma.calendar.findMany({
      where: { officeId, deletedAt: null },
      select: {
        ...CAMPOS,
        user: { select: { id: true, name: true } },
        _count: { select: { events: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return agendas;
  }

  async detalhar(officeId: string, id: string) {
    const agenda = await this.prisma.calendar.findFirst({
      where: { id, officeId, deletedAt: null },
      select: {
        ...CAMPOS,
        user: { select: { id: true, name: true } },
        availableDays: true,
      },
    });

    if (!agenda) throw new NotFoundException('Agenda não encontrada');

    return {
      ...agenda,
      availableDays: this.ordenarSemana(agenda.availableDays),
    };
  }

  async criar(officeId: string, userId: string, dto: CriarAgendaDto) {
    const { availableDays, ...dados } = dto;

    const agenda = await this.prisma.calendar.create({
      data: {
        ...dados,
        officeId,
        userId,
        availableDays: { create: availableDays ?? [] },
      },
      select: { ...CAMPOS, availableDays: true },
    });

    await this.invalidarPrompt(officeId);

    return agenda;
  }

  /**
   * Atualiza a agenda e, quando os dias vierem no corpo, substitui a
   * configuração inteira.
   *
   * A substituição é total de propósito: a interface envia sempre os sete
   * dias, e um merge parcial deixaria um dia desmarcado na tela ainda
   * disponível no banco.
   */
  async atualizar(officeId: string, id: string, dto: AtualizarAgendaDto) {
    await this.garantirQueExiste(officeId, id);

    const { availableDays, ...dados } = dto;

    const agenda = await this.prisma.$transaction(async (tx) => {
      if (availableDays) {
        await tx.calendarAvailableDay.deleteMany({ where: { calendarId: id } });
        await tx.calendarAvailableDay.createMany({
          data: availableDays.map((d) => ({ ...d, calendarId: id })),
        });
      }

      return tx.calendar.update({
        where: { id },
        data: dados,
        select: { ...CAMPOS, availableDays: true },
      });
    });

    await this.invalidarPrompt(officeId);

    return agenda;
  }

  async remover(officeId: string, id: string): Promise<void> {
    await this.garantirQueExiste(officeId, id);

    await this.prisma.calendar.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.invalidarPrompt(officeId);
  }

  private ordenarSemana<T extends { day: Weekday }>(dias: T[]): T[] {
    return [...dias].sort(
      (a, b) => ORDEM_SEMANA.indexOf(a.day) - ORDEM_SEMANA.indexOf(b.day),
    );
  }

  private async garantirQueExiste(officeId: string, id: string): Promise<void> {
    const existe = await this.prisma.calendar.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { id: true },
    });

    if (!existe) throw new NotFoundException('Agenda não encontrada');
  }
}

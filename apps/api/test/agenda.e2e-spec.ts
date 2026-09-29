import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ReminderStatus } from '@cacia/database';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { criarConta, type Conta } from './apoio/contas';

interface Agenda {
  id: string;
  title: string;
}

interface Evento {
  id: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
}

/** Uma data no futuro, para que os lembretes não nasçam vencidos. */
function daquiA(horas: number): string {
  return new Date(Date.now() + horas * 3_600_000).toISOString();
}

describe('agenda (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let conta: Conta;
  let agenda: Agenda;

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    conta = await criarConta(aplicacao.url);

    const criada = await conta.api.post<Agenda>('/calendars', {
      title: 'Atendimento',
      availableDays: [
        {
          day: 'MONDAY',
          available: true,
          startTime: '09:00',
          endTime: '18:00',
        },
      ],
    });
    agenda = criada.corpo;
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  describe('agendas', () => {
    it('foi criada com os dias de disponibilidade', async () => {
      const resposta = await conta.api.get<{ availableDays: unknown[] }>(
        `/calendars/${agenda.id}`,
      );

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.availableDays).toHaveLength(1);
    });

    it('recusa horário fora do formato HH:MM', async () => {
      const resposta = await conta.api.post('/calendars', {
        title: 'Inválida',
        availableDays: [{ day: 'MONDAY', startTime: '25:99' }],
      });

      expect(resposta.status).toBe(400);
    });

    it('aceita dia de folga com horário em branco, como a tela envia', async () => {
      // `@IsOptional` não dispensa string vazia: toda agenda com um dia
      // desmarcado era recusada com 400.
      const resposta = await conta.api.post('/calendars', {
        title: 'Com folga',
        availableDays: [
          {
            day: 'MONDAY',
            available: true,
            startTime: '08:00',
            endTime: '12:00',
            shift2Available: false,
            shift2StartTime: '',
            shift2EndTime: '',
          },
          { day: 'SUNDAY', available: false, startTime: '', endTime: '' },
        ],
      });

      expect(resposta.status).toBe(201);
    });

    it('recusa dia da semana que não existe', async () => {
      const resposta = await conta.api.post('/calendars', {
        title: 'Inválida',
        availableDays: [{ day: 'SEGUNDA' }],
      });

      expect(resposta.status).toBe(400);
    });
  });

  describe('compromissos', () => {
    let evento: Evento;

    it('cria', async () => {
      const resposta = await conta.api.post<Evento>('/events', {
        calendarId: agenda.id,
        title: 'Audiência de conciliação',
        startTime: daquiA(48),
        endTime: daquiA(49),
      });

      expect(resposta.status).toBe(201);
      evento = resposta.corpo;
    });

    it('recusa término antes do início', async () => {
      const resposta = await conta.api.post('/events', {
        calendarId: agenda.id,
        title: 'Impossível',
        startTime: daquiA(49),
        endTime: daquiA(48),
      });

      expect(resposta.status).toBe(400);
    });

    it('recusa data que não é data', async () => {
      const resposta = await conta.api.post('/events', {
        calendarId: agenda.id,
        title: 'Sem data',
        startTime: 'amanhã de manhã',
        endTime: daquiA(49),
      });

      expect(resposta.status).toBe(400);
    });

    it('lista e detalha', async () => {
      const lista = await conta.api.get<{ data: Evento[] }>('/events');
      expect(lista.corpo.data.map((e) => e.id)).toContain(evento.id);

      const detalhe = await conta.api.get<Evento>(`/events/${evento.id}`);
      expect(detalhe.status).toBe(200);
    });

    it('cancela', async () => {
      const resposta = await conta.api.post<Evento>(
        `/events/${evento.id}/cancel`,
      );

      expect(resposta.status).toBe(201);
      expect(resposta.corpo.status).toBe('CANCEL');
    });
  });

  describe('lembretes', () => {
    it('nascem junto com o compromisso, um por antecedência', async () => {
      const resposta = await conta.api.post<Evento>('/events', {
        calendarId: agenda.id,
        title: 'Prazo recursal',
        startTime: daquiA(72),
        endTime: daquiA(73),
        reminderOffsets: [60, 1440],
      });

      const lembretes = await aplicacao.prisma.reminder.findMany({
        where: { eventId: resposta.corpo.id },
        orderBy: { timeTrigger: 'asc' },
        select: { timeTrigger: true, triggerAt: true, status: true },
      });

      expect(lembretes).toHaveLength(2);
      expect(lembretes.map((l) => l.timeTrigger)).toEqual([60, 1440]);
      expect(lembretes[0]?.status).toBe(ReminderStatus.PENDING);
    });

    it('o disparo fica na antecedência pedida', async () => {
      const inicio = daquiA(96);
      const resposta = await conta.api.post<Evento>('/events', {
        calendarId: agenda.id,
        title: 'Reunião com o cliente',
        startTime: inicio,
        endTime: daquiA(97),
        reminderOffsets: [30],
      });

      const lembrete = await aplicacao.prisma.reminder.findFirst({
        where: { eventId: resposta.corpo.id },
        select: { triggerAt: true },
      });

      const esperado = new Date(inicio).getTime() - 30 * 60_000;
      expect(lembrete?.triggerAt?.getTime()).toBe(esperado);
    });

    it('remarcar o compromisso recalcula o disparo', async () => {
      // Sem isso, o aviso sairia no horário antigo — sobre um compromisso que
      // já foi remarcado.
      const criado = await conta.api.post<Evento>('/events', {
        calendarId: agenda.id,
        title: 'Perícia',
        startTime: daquiA(120),
        endTime: daquiA(121),
        reminderOffsets: [60],
      });

      const novoInicio = daquiA(144);
      await conta.api.patch(`/events/${criado.corpo.id}`, {
        startTime: novoInicio,
        endTime: daquiA(145),
      });

      const lembrete = await aplicacao.prisma.reminder.findFirst({
        where: { eventId: criado.corpo.id },
        select: { triggerAt: true },
      });

      const esperado = new Date(novoInicio).getTime() - 60 * 60_000;
      expect(lembrete?.triggerAt?.getTime()).toBe(esperado);
    });

    it('cancelar o compromisso cancela os lembretes pendentes', async () => {
      const criado = await conta.api.post<Evento>('/events', {
        calendarId: agenda.id,
        title: 'Sustentação oral',
        startTime: daquiA(168),
        endTime: daquiA(169),
        reminderOffsets: [15],
      });

      await conta.api.post(`/events/${criado.corpo.id}/cancel`);

      const lembretes = await aplicacao.prisma.reminder.findMany({
        where: { eventId: criado.corpo.id },
        select: { status: true },
      });

      expect(
        lembretes.every((l) => l.status === ReminderStatus.CANCELLED),
      ).toBe(true);
    });

    it('recusa mais antecedências que o teto', async () => {
      const resposta = await conta.api.post('/events', {
        calendarId: agenda.id,
        title: 'Excessivo',
        startTime: daquiA(200),
        endTime: daquiA(201),
        reminderOffsets: [1, 2, 3, 4, 5, 6],
      });

      expect(resposta.status).toBe(400);
    });

    it('recusa antecedência acima de 14 dias', async () => {
      const resposta = await conta.api.post('/events', {
        calendarId: agenda.id,
        title: 'Cedo demais',
        startTime: daquiA(200),
        endTime: daquiA(201),
        reminderOffsets: [40000],
      });

      expect(resposta.status).toBe(400);
    });

    it('a rota de falhas existe e começa vazia', async () => {
      // Existe para tornar a falha visível: no sistema anterior um lembrete
      // perdido não aparecia em lugar nenhum.
      const resposta = await conta.api.get<unknown[]>('/reminders/failed');

      expect(resposta.status).toBe(200);
      expect(resposta.corpo).toEqual([]);
    });
  });
});

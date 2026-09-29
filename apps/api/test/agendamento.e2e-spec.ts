import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { criarConta, type Conta } from './apoio/contas';

/**
 * Agendamento a partir do funil.
 *
 * A configuração de dias e turnos estava no banco desde o começo e ninguém a
 * consultava: dava para marcar às três da manhã de domingo, ou dois
 * compromissos no mesmo horário, e o sistema aceitava os dois. Este arquivo
 * cobre a ligação que faltava.
 */

interface Horario {
  inicio: string;
  fim: string;
  online: boolean;
  inPerson: boolean;
}

interface Disponibilidade {
  date: string;
  duracaoMinutos: number;
  slots: Horario[];
}

interface Compromisso {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  leadId: string | null;
}

/** 2026-09-14 é segunda; 2026-09-13, domingo. */
const SEGUNDA = '2026-09-14';
const DOMINGO = '2026-09-13';

/** Como o horário aparece no relógio de São Paulo. */
function emSaoPaulo(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });
}

describe('agendamento (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let conta: Conta;
  let agendaId: string;
  let leadId: string;

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    conta = await criarConta(aplicacao.url);

    const agenda = await conta.api.post<{ id: string }>('/calendars', {
      title: 'Atendimento',
      availableDays: [
        {
          day: 'MONDAY',
          available: true,
          startTime: '09:00',
          endTime: '12:00',
          online: true,
          inPerson: false,
          shift2Available: true,
          shift2StartTime: '14:00',
          shift2EndTime: '16:00',
          shift2Online: false,
          shift2InPerson: true,
        },
        { day: 'SUNDAY', available: false },
      ],
    });
    agendaId = agenda.corpo.id;

    const lead = await conta.api.post<{ id: string }>('/leads', {
      name: 'Cliente em prospecção',
      remotejid: '11944443333',
    });
    leadId = lead.corpo.id;
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  describe('horários livres', () => {
    it('respeita os dois turnos configurados', async () => {
      const resposta = await conta.api.get<Disponibilidade>(
        `/calendars/${agendaId}/availability?date=${SEGUNDA}&duracaoMinutos=60`,
      );

      expect(resposta.status).toBe(200);

      const horas = resposta.corpo.slots.map((s) => emSaoPaulo(s.inicio));
      expect(horas).toEqual(['09:00', '10:00', '11:00', '14:00', '15:00']);
    });

    it('a modalidade acompanha o turno', async () => {
      const resposta = await conta.api.get<Disponibilidade>(
        `/calendars/${agendaId}/availability?date=${SEGUNDA}&duracaoMinutos=60`,
      );

      // Manhã é online, tarde é presencial — como foi configurado
      expect(resposta.corpo.slots[0]?.online).toBe(true);
      expect(resposta.corpo.slots[4]?.inPerson).toBe(true);
    });

    it('dia sem atendimento não oferece horário', async () => {
      const resposta = await conta.api.get<Disponibilidade>(
        `/calendars/${agendaId}/availability?date=${DOMINGO}`,
      );

      // Era o que permitia marcar às três da manhã de domingo
      expect(resposta.corpo.slots).toEqual([]);
    });

    it('data fora do formato é recusada', async () => {
      const resposta = await conta.api.get(
        `/calendars/${agendaId}/availability?date=14/09/2026`,
      );

      expect(resposta.status).toBe(400);
    });

    it('agenda inexistente é 404', async () => {
      const resposta = await conta.api.get(
        `/calendars/aaaaaaaa-0000-4000-8000-000000000099/availability?date=${SEGUNDA}`,
      );

      expect(resposta.status).toBe(404);
    });
  });

  describe('marcar a partir de um horário livre', () => {
    let compromisso: Compromisso;

    it('cria o compromisso ligado ao lead', async () => {
      const livres = await conta.api.get<Disponibilidade>(
        `/calendars/${agendaId}/availability?date=${SEGUNDA}&duracaoMinutos=60`,
      );
      const escolhido = livres.corpo.slots[0]!;

      const resposta = await conta.api.post<Compromisso>('/events', {
        calendarId: agendaId,
        leadId,
        title: 'Consulta inicial',
        type: 'CALL',
        startTime: escolhido.inicio,
        endTime: escolhido.fim,
      });

      expect(resposta.status).toBe(201);
      compromisso = resposta.corpo;
      expect(compromisso.leadId).toBe(leadId);
    });

    it('o horário some da disponibilidade', async () => {
      const livres = await conta.api.get<Disponibilidade>(
        `/calendars/${agendaId}/availability?date=${SEGUNDA}&duracaoMinutos=60`,
      );

      const horas = livres.corpo.slots.map((s) => emSaoPaulo(s.inicio));
      expect(horas).not.toContain('09:00');
      expect(horas).toContain('10:00');
    });

    it('aparece na ficha do lead', async () => {
      const resposta = await conta.api.get<{ data: Compromisso[] }>(
        `/events?leadId=${leadId}`,
      );

      expect(resposta.corpo.data.map((e) => e.id)).toContain(compromisso.id);
    });

    it('marcar em cima é recusado, com o compromisso que conflita', async () => {
      const resposta = await conta.api.post<{ eventId: string }>('/events', {
        calendarId: agendaId,
        title: 'Outra coisa no mesmo horário',
        startTime: compromisso.startTime,
        endTime: compromisso.endTime,
      });

      expect(resposta.status).toBe(409);
      expect(resposta.corpo.eventId).toBe(compromisso.id);
    });

    it('sobreposição parcial também é recusada', async () => {
      // O conflito mais comum: começa meia hora antes e invade
      const inicio = new Date(compromisso.startTime);
      inicio.setMinutes(inicio.getMinutes() - 30);
      const fim = new Date(compromisso.startTime);
      fim.setMinutes(fim.getMinutes() + 30);

      const resposta = await conta.api.post('/events', {
        calendarId: agendaId,
        title: 'Invasor',
        startTime: inicio.toISOString(),
        endTime: fim.toISOString(),
      });

      expect(resposta.status).toBe(409);
    });

    it('com permitirConflito, marca mesmo assim', async () => {
      // Nem toda sobreposição é erro — um prazo e uma reunião podem coincidir
      // de propósito. O que não pode é acontecer sem ninguém dizer que tudo bem.
      const resposta = await conta.api.post('/events', {
        calendarId: agendaId,
        title: 'Prazo processual',
        type: 'DEADLINE',
        startTime: compromisso.startTime,
        endTime: compromisso.endTime,
        permitirConflito: true,
      });

      expect(resposta.status).toBe(201);
    });

    it('remarcar para o próprio horário não conflita consigo mesmo', async () => {
      // Compromisso próprio, num horário que só ele ocupa: reusar o da suíte
      // esbarraria no prazo criado acima com permitirConflito — que é um
      // conflito de verdade, não o do compromisso consigo mesmo.
      const livres = await conta.api.get<Disponibilidade>(
        `/calendars/${agendaId}/availability?date=${SEGUNDA}&duracaoMinutos=60`,
      );
      const livre = livres.corpo.slots[0]!;

      const sozinho = await conta.api.post<Compromisso>('/events', {
        calendarId: agendaId,
        title: 'Sozinho no horário',
        startTime: livre.inicio,
        endTime: livre.fim,
      });

      const resposta = await conta.api.patch<Compromisso>(
        `/events/${sozinho.corpo.id}`,
        { startTime: livre.inicio, endTime: livre.fim },
      );

      // Sem ignorar a si mesmo, remarcar para o mesmo horário colidiria com
      // o próprio registro.
      expect(resposta.status).toBe(200);

      await conta.api.post(`/events/${sozinho.corpo.id}/cancel`);
    });

    it('remarcar para cima de outro é recusado', async () => {
      const livres = await conta.api.get<Disponibilidade>(
        `/calendars/${agendaId}/availability?date=${SEGUNDA}&duracaoMinutos=60`,
      );
      const livre = livres.corpo.slots[0]!;

      const outro = await conta.api.post<Compromisso>('/events', {
        calendarId: agendaId,
        title: 'Reunião da tarde',
        startTime: livre.inicio,
        endTime: livre.fim,
      });

      const resposta = await conta.api.patch(`/events/${outro.corpo.id}`, {
        startTime: compromisso.startTime,
        endTime: compromisso.endTime,
      });

      expect(resposta.status).toBe(409);
    });

    it('o horário do compromisso cancelado volta a ficar livre', async () => {
      const antes = await conta.api.get<Disponibilidade>(
        `/calendars/${agendaId}/availability?date=${SEGUNDA}&duracaoMinutos=60`,
      );
      expect(antes.corpo.slots.map((s) => emSaoPaulo(s.inicio))).not.toContain(
        '09:00',
      );

      // Dois ocupam as 09:00 — o normal e o prazo marcado com permitirConflito
      const ocupando = await aplicacao.prisma.event.findMany({
        where: {
          officeId: conta.officeId,
          startTime: new Date(compromisso.startTime),
          deletedAt: null,
        },
        select: { id: true },
      });

      for (const evento of ocupando) {
        await conta.api.post(`/events/${evento.id}/cancel`);
      }

      const depois = await conta.api.get<Disponibilidade>(
        `/calendars/${agendaId}/availability?date=${SEGUNDA}&duracaoMinutos=60`,
      );

      expect(depois.corpo.slots.map((s) => emSaoPaulo(s.inicio))).toContain(
        '09:00',
      );
    });
  });

  describe('expediente da agenda', () => {
    // Outra semana, para não disputar horário com os testes de conflito acima.
    // Horários em UTC: São Paulo está três horas atrás.
    const SEGUNDA_SEGUINTE_10H = '2026-09-21T13:00:00.000Z';
    const SEGUNDA_SEGUINTE_11H = '2026-09-21T14:00:00.000Z';
    const INTERVALO_DO_ALMOCO = '2026-09-21T15:30:00.000Z';
    const INTERVALO_FIM = '2026-09-21T16:30:00.000Z';
    const DOMINGO_3H = '2026-09-20T06:00:00.000Z';
    const DOMINGO_4H = '2026-09-20T07:00:00.000Z';

    it('atendimento de madrugada no domingo é recusado', async () => {
      const resposta = await conta.api.post<{ message: string }>('/events', {
        calendarId: agendaId,
        title: 'Atendimento fora de hora',
        type: 'SERVICE',
        startTime: DOMINGO_3H,
        endTime: DOMINGO_4H,
      });

      expect(resposta.status).toBe(409);
      expect(resposta.corpo.message).toBe(
        'Fora do horário de atendimento da agenda',
      );
    });

    it('reunião que atravessa o intervalo entre turnos é recusada', async () => {
      const resposta = await conta.api.post('/events', {
        calendarId: agendaId,
        title: 'Reunião no almoço',
        type: 'MEETING',
        startTime: INTERVALO_DO_ALMOCO,
        endTime: INTERVALO_FIM,
      });

      expect(resposta.status).toBe(409);
    });

    it('atendimento dentro do turno é aceito', async () => {
      const resposta = await conta.api.post('/events', {
        calendarId: agendaId,
        title: 'Atendimento na manhã',
        type: 'SERVICE',
        startTime: SEGUNDA_SEGUINTE_10H,
        endTime: SEGUNDA_SEGUINTE_11H,
      });

      expect(resposta.status).toBe(201);
    });

    it('prazo processual não depende do expediente', async () => {
      // A data do prazo é imposta de fora; recusá-la impediria o registro
      const resposta = await conta.api.post('/events', {
        calendarId: agendaId,
        title: 'Prazo no domingo',
        type: 'DEADLINE',
        startTime: DOMINGO_3H,
        endTime: DOMINGO_4H,
      });

      expect(resposta.status).toBe(201);
    });

    it('com permitirConflito, o atendimento fora de hora é aceito', async () => {
      const resposta = await conta.api.post('/events', {
        calendarId: agendaId,
        title: 'Plantão combinado',
        type: 'SERVICE',
        startTime: DOMINGO_3H,
        endTime: DOMINGO_4H,
        permitirConflito: true,
      });

      expect(resposta.status).toBe(201);
    });

    it('remarcar um atendimento para fora do expediente é recusado', async () => {
      const criado = await conta.api.post<Compromisso>('/events', {
        calendarId: agendaId,
        title: 'Atendimento remarcável',
        type: 'SERVICE',
        startTime: '2026-09-21T14:00:00.000Z',
        endTime: '2026-09-21T15:00:00.000Z',
      });
      expect(criado.status).toBe(201);

      const resposta = await conta.api.patch(`/events/${criado.corpo.id}`, {
        startTime: INTERVALO_DO_ALMOCO,
        endTime: INTERVALO_FIM,
      });

      expect(resposta.status).toBe(409);
    });
  });

  describe('vínculos do compromisso', () => {
    it('cliente que não é deste escritório é 404, não erro interno', async () => {
      const resposta = await conta.api.post<{ message: string }>('/events', {
        calendarId: agendaId,
        customerId: 'aaaaaaaa-0000-4000-8000-000000000099',
        title: 'Com cliente alheio',
        type: 'DEADLINE',
        startTime: '2026-10-01T13:00:00.000Z',
        endTime: '2026-10-01T14:00:00.000Z',
      });

      // Antes o banco recusava pela chave composta e a API devolvia 500
      expect(resposta.status).toBe(404);
      expect(resposta.corpo.message).toBe('Cliente não encontrado');
    });

    it('lead que não é deste escritório é 404', async () => {
      const resposta = await conta.api.post<{ message: string }>('/events', {
        calendarId: agendaId,
        leadId: 'aaaaaaaa-0000-4000-8000-000000000099',
        title: 'Com lead alheio',
        type: 'DEADLINE',
        startTime: '2026-10-01T13:00:00.000Z',
        endTime: '2026-10-01T14:00:00.000Z',
      });

      expect(resposta.status).toBe(404);
      expect(resposta.corpo.message).toBe('Lead não encontrado');
    });
  });
});

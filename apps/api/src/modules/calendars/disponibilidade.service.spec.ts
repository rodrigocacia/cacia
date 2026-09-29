import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import { DisponibilidadeService } from './disponibilidade.service';

/**
 * Os horários livres de uma agenda.
 *
 * A configuração de dias e turnos estava no banco desde o começo e ninguém a
 * consultava: dava para marcar às três da manhã de domingo, ou dois
 * compromissos no mesmo horário, e o sistema aceitava os dois.
 */

const ESCRITORIO = 'aaaaaaaa-0000-0000-0000-000000000001';
const AGENDA = 'bbbbbbbb-0000-0000-0000-000000000001';

/** 2026-09-14 é uma segunda-feira. */
const SEGUNDA = '2026-09-14';

function montar(opcoes: {
  agenda?: { id: string; status: boolean } | null;
  dia?: Record<string, unknown> | null;
  eventos?: Array<{ startTime: Date; endTime: Date }>;
}) {
  const eventoFindMany = vi.fn().mockResolvedValue(opcoes.eventos ?? []);
  const eventoFindFirst = vi.fn().mockResolvedValue(null);

  const prisma = {
    calendar: {
      findFirst: vi
        .fn()
        .mockResolvedValue(
          opcoes.agenda === undefined
            ? { id: AGENDA, status: true }
            : opcoes.agenda,
        ),
    },
    calendarAvailableDay: {
      findUnique: vi.fn().mockResolvedValue(opcoes.dia ?? null),
    },
    event: { findMany: eventoFindMany, findFirst: eventoFindFirst },
  } as unknown as PrismaService;

  return {
    servico: new DisponibilidadeService(prisma),
    eventoFindMany,
    eventoFindFirst,
  };
}

/** Um turno único, das 09h às 12h. */
const MANHA = {
  available: true,
  startTime: '09:00',
  endTime: '12:00',
  online: true,
  inPerson: false,
  shift2Available: false,
  shift2StartTime: null,
  shift2EndTime: null,
  shift2Online: false,
  shift2InPerson: false,
};

/** Como o horário aparece no relógio de São Paulo. */
function emSaoPaulo(data: Date): string {
  return data.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });
}

describe('horários livres', () => {
  it('gera os horários do turno configurado, no fuso do escritório', async () => {
    const { servico } = montar({ dia: MANHA });

    const { slots } = await servico.doDia(ESCRITORIO, AGENDA, SEGUNDA, 60);

    expect(slots).toHaveLength(3);
    // O horário está gravado como texto, sem fuso. Interpretá-lo em UTC
    // colocaria o expediente três horas fora do lugar.
    expect(emSaoPaulo(slots[0]!.inicio)).toBe('09:00');
    expect(emSaoPaulo(slots[2]!.inicio)).toBe('11:00');
    expect(emSaoPaulo(slots[2]!.fim)).toBe('12:00');
  });

  it('a duração define de quanto em quanto os horários saem', async () => {
    const { servico } = montar({ dia: MANHA });

    const { slots } = await servico.doDia(ESCRITORIO, AGENDA, SEGUNDA, 30);

    expect(slots).toHaveLength(6);
    expect(emSaoPaulo(slots[1]!.inicio)).toBe('09:30');
  });

  it('não gera horário que ultrapassa o fim do turno', async () => {
    const { servico } = montar({ dia: MANHA });

    // 09h-12h com atendimento de 2h cabe duas vezes, não duas e meia
    const { slots } = await servico.doDia(ESCRITORIO, AGENDA, SEGUNDA, 120);

    expect(slots).toHaveLength(1);
    expect(emSaoPaulo(slots[0]!.fim)).toBe('11:00');
  });

  it('soma os dois turnos do dia', async () => {
    const { servico } = montar({
      dia: {
        ...MANHA,
        shift2Available: true,
        shift2StartTime: '14:00',
        shift2EndTime: '16:00',
        shift2Online: false,
        shift2InPerson: true,
      },
    });

    const { slots } = await servico.doDia(ESCRITORIO, AGENDA, SEGUNDA, 60);

    expect(slots).toHaveLength(5);
    // A modalidade acompanha o turno: o da tarde é presencial
    expect(slots[4]?.inPerson).toBe(true);
    expect(slots[0]?.inPerson).toBe(false);
  });

  it('remove o horário já ocupado', async () => {
    const ocupado = {
      startTime: new Date('2026-09-14T13:00:00.000Z'), // 10h em SP
      endTime: new Date('2026-09-14T14:00:00.000Z'),
    };

    const { servico } = montar({ dia: MANHA, eventos: [ocupado] });

    const { slots } = await servico.doDia(ESCRITORIO, AGENDA, SEGUNDA, 60);

    expect(slots.map((s) => emSaoPaulo(s.inicio))).toEqual(['09:00', '11:00']);
  });

  it('compromisso que começa antes e invade o horário também ocupa', async () => {
    // O conflito mais comum: uma reunião de duas horas começando meia hora
    // antes. Comparar só o início deixaria passar.
    const invasor = {
      startTime: new Date('2026-09-14T11:30:00.000Z'), // 08:30 em SP
      endTime: new Date('2026-09-14T13:30:00.000Z'), // 10:30 em SP
    };

    const { servico } = montar({ dia: MANHA, eventos: [invasor] });

    const { slots } = await servico.doDia(ESCRITORIO, AGENDA, SEGUNDA, 60);

    expect(slots.map((s) => emSaoPaulo(s.inicio))).toEqual(['11:00']);
  });

  it('dia não configurado não oferece horário', async () => {
    const { servico } = montar({ dia: null });

    const { slots } = await servico.doDia(ESCRITORIO, AGENDA, SEGUNDA, 60);

    expect(slots).toEqual([]);
  });

  it('dia marcado como indisponível não oferece horário', async () => {
    const { servico } = montar({ dia: { ...MANHA, available: false } });

    const { slots } = await servico.doDia(ESCRITORIO, AGENDA, SEGUNDA, 60);

    expect(slots).toEqual([]);
  });

  it('agenda desativada não oferece horário e não consulta eventos', async () => {
    const { servico, eventoFindMany } = montar({
      agenda: { id: AGENDA, status: false },
      dia: MANHA,
    });

    const { slots } = await servico.doDia(ESCRITORIO, AGENDA, SEGUNDA, 60);

    expect(slots).toEqual([]);
    expect(eventoFindMany).not.toHaveBeenCalled();
  });

  it('agenda de outro escritório responde como inexistente', async () => {
    const { servico } = montar({ agenda: null, dia: MANHA });

    await expect(
      servico.doDia(ESCRITORIO, AGENDA, SEGUNDA, 60),
    ).rejects.toThrow('Agenda não encontrada');
  });

  it('data em formato errado é recusada', async () => {
    const { servico } = montar({ dia: MANHA });

    await expect(
      servico.doDia(ESCRITORIO, AGENDA, '14/09/2026', 60),
    ).rejects.toThrow('AAAA-MM-DD');
  });
});

describe('conflito de horário', () => {
  it('procura sobreposição, não igualdade de início', async () => {
    const { servico, eventoFindFirst } = montar({ dia: MANHA });

    const inicio = new Date('2026-09-14T13:00:00.000Z');
    const fim = new Date('2026-09-14T14:00:00.000Z');

    await servico.conflito(ESCRITORIO, AGENDA, inicio, fim);

    const where = eventoFindFirst.mock.calls[0]?.[0] as {
      where: Record<string, unknown>;
    };

    expect(where.where.officeId).toBe(ESCRITORIO);
    expect(where.where.startTime).toEqual({ lt: fim });
    expect(where.where.endTime).toEqual({ gt: inicio });
  });

  it('ignora o próprio compromisso ao remarcar', async () => {
    // Sem isto, remarcar para o mesmo horário colidiria consigo mesmo.
    const { servico, eventoFindFirst } = montar({ dia: MANHA });

    await servico.conflito(
      ESCRITORIO,
      AGENDA,
      new Date('2026-09-14T13:00:00.000Z'),
      new Date('2026-09-14T14:00:00.000Z'),
      'evento-1',
    );

    const where = eventoFindFirst.mock.calls[0]?.[0] as {
      where: { id?: unknown };
    };

    expect(where.where.id).toEqual({ not: 'evento-1' });
  });
});

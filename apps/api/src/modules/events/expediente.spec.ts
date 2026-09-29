import { describe, expect, it } from 'vitest';
import { Weekday } from '@cacia/database';
import { dentroDoExpediente, type DiaDeAtendimento } from './expediente';

/** Segunda com manhã 09–12 e tarde 14–18, no relógio de São Paulo. */
const SEGUNDA: DiaDeAtendimento = {
  day: Weekday.MONDAY,
  available: true,
  startTime: '09:00',
  endTime: '12:00',
  shift2Available: true,
  shift2StartTime: '14:00',
  shift2EndTime: '18:00',
};

/** 2026-09-14 é segunda; São Paulo está três horas atrás do UTC. */
function segunda(horaLocal: string): Date {
  return new Date(`2026-09-14T${horaLocal}:00-03:00`);
}

describe('dentroDoExpediente', () => {
  it('aceita o que cabe num turno', () => {
    expect(
      dentroDoExpediente(segunda('09:00'), segunda('10:00'), [SEGUNDA]),
    ).toBe(true);
    expect(
      dentroDoExpediente(segunda('17:00'), segunda('18:00'), [SEGUNDA]),
    ).toBe(true);
  });

  it('recusa o que atravessa o intervalo entre turnos', () => {
    expect(
      dentroDoExpediente(segunda('11:30'), segunda('14:30'), [SEGUNDA]),
    ).toBe(false);
  });

  it('recusa antes da abertura e depois do fechamento', () => {
    expect(
      dentroDoExpediente(segunda('08:30'), segunda('09:30'), [SEGUNDA]),
    ).toBe(false);
    expect(
      dentroDoExpediente(segunda('17:30'), segunda('18:30'), [SEGUNDA]),
    ).toBe(false);
  });

  it('lê o horário no fuso do escritório, não em UTC', () => {
    // 12:00Z é 09:00 em São Paulo — em UTC pareceria meio-dia
    expect(
      dentroDoExpediente(
        new Date('2026-09-14T12:00:00Z'),
        new Date('2026-09-14T13:00:00Z'),
        [SEGUNDA],
      ),
    ).toBe(true);
  });

  it('recusa dia sem configuração e turno desligado', () => {
    expect(
      dentroDoExpediente(
        new Date('2026-09-13T12:00:00-03:00'),
        new Date('2026-09-13T13:00:00-03:00'),
        [SEGUNDA],
      ),
    ).toBe(false);

    expect(
      dentroDoExpediente(segunda('09:00'), segunda('10:00'), [
        { ...SEGUNDA, available: false },
      ]),
    ).toBe(false);
  });
});

import { parseISO } from "date-fns"

/**
 * Horário de um evento da agenda como `Date` local com o relógio de Brasília
 * (America/Sao_Paulo — sem horário de verão desde 2019, sempre UTC−3).
 *
 * `getEvent` devolve `start_time`/`end_time` já deslocados três horas: a
 * string tem o horário de parede de Brasília escrito como se fosse UTC
 * ("2026-10-12T09:30:00.000Z" é a consulta das 09:30). Os rótulos liam esse
 * texto, mas a grade lia `getHours(parseISO(...))` — no fuso do navegador —,
 * e a consulta das 09:30 caía na linha das 06:00.
 *
 * Aqui o sufixo de fuso é descartado e a data é montada no fuso local com
 * os mesmos campos do texto. Assim posição na grade, dia e rótulo saem todos
 * do mesmo horário de parede, qualquer que seja o fuso da máquina.
 */
export function horarioDaAgenda(iso: string): Date {
  return parseISO(iso.slice(0, 19))
}

import { EventType, Weekday } from '@cacia/database';

/**
 * Mesmo fuso da disponibilidade: os turnos são gravados como texto ("09:00"),
 * sem fuso, e valem no relógio do escritório.
 */
const FUSO = 'America/Sao_Paulo';

const DIAS: Weekday[] = [
  Weekday.SUNDAY,
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

/**
 * Tipos que ocupam o horário de atendimento da agenda.
 *
 * Só estes são barrados fora do expediente. Audiência, inquérito e prazo têm
 * data imposta de fora — pelo tribunal, pela delegacia, pela lei — e recusá-los
 * impediria justamente o registro que o advogado mais precisa. "Compromisso"
 * (COMMITMENT) é o genérico, usado para anotações pessoais e tarefas, e
 * ligação/follow-up são atividades internas do funil: nenhum deles é o cliente
 * sendo atendido no horário que a agenda oferece.
 */
export const TIPOS_DE_ATENDIMENTO: ReadonlySet<EventType> = new Set([
  EventType.SERVICE,
  EventType.MEETING,
]);

export interface DiaDeAtendimento {
  day: Weekday;
  available: boolean;
  startTime: string | null;
  endTime: string | null;
  shift2Available: boolean;
  shift2StartTime: string | null;
  shift2EndTime: string | null;
}

function emMinutos(hora: string | null): number | null {
  if (!hora) return null;

  const [h, m] = hora.split(':');
  const horas = Number(h);
  const minutos = Number(m ?? 0);

  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return null;

  return horas * 60 + minutos;
}

/** Data e minuto do dia em que o relógio do escritório marca este instante. */
function noRelogioDoEscritorio(instante: Date): {
  data: string;
  diaDaSemana: Weekday;
  minuto: number;
} {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: FUSO,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .formatToParts(instante)
      .map((p) => [p.type, p.value]),
  );

  const ano = Number(partes.year);
  const mes = Number(partes.month);
  const dia = Number(partes.day);

  return {
    data: `${partes.year}-${partes.month}-${partes.day}`,
    diaDaSemana: DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()]!,
    // O Intl devolve 24 para meia-noite com hour12: false
    minuto: (Number(partes.hour) % 24) * 60 + Number(partes.minute),
  };
}

/**
 * Se o compromisso cabe inteiro num dos turnos do dia.
 *
 * Precisa caber num turno só: começar no fim da manhã e terminar no começo da
 * tarde atravessaria o intervalo, que é exatamente o horário em que o
 * advogado disse que não atende.
 */
export function dentroDoExpediente(
  inicio: Date,
  fim: Date,
  dias: DiaDeAtendimento[],
): boolean {
  const de = noRelogioDoEscritorio(inicio);
  const ate = noRelogioDoEscritorio(fim);

  // Terminar à meia-noite em ponto conta como fim do mesmo dia — desde que
  // seja a meia-noite seguinte, e não a de dois dias depois.
  const meiaNoiteSeguinte =
    ate.minuto === 0 && fim.getTime() - inicio.getTime() <= 86_400_000;
  const fimNoMesmoDia =
    ate.data === de.data ? ate.minuto : meiaNoiteSeguinte ? 24 * 60 : null;

  if (fimNoMesmoDia === null) return false;

  const configuracao = dias.find((d) => d.day === de.diaDaSemana);

  if (!configuracao) return false;

  const turnos = [
    configuracao.available
      ? [emMinutos(configuracao.startTime), emMinutos(configuracao.endTime)]
      : [null, null],
    configuracao.shift2Available
      ? [
          emMinutos(configuracao.shift2StartTime),
          emMinutos(configuracao.shift2EndTime),
        ]
      : [null, null],
  ];

  return turnos.some(
    ([abre, fecha]) =>
      abre != null &&
      fecha != null &&
      de.minuto >= abre &&
      fimNoMesmoDia <= fecha,
  );
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus, Weekday } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';

/**
 * Fuso de referência do escritório.
 *
 * Os horários de atendimento são gravados como texto — "09:00" — sem fuso
 * nenhum. Interpretá-los em UTC colocaria o expediente três horas fora do
 * lugar, e é o mesmo fuso que o resto da aplicação já usa para exibir data.
 */
const FUSO = 'America/Sao_Paulo';

/** Duração padrão de um atendimento, quando ninguém disse outra. */
const DURACAO_PADRAO_MINUTOS = 60;

const DIAS: Weekday[] = [
  Weekday.SUNDAY,
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

export interface Horario {
  inicio: Date;
  fim: Date;
  online: boolean;
  inPerson: boolean;
}

/**
 * Quanto o relógio de parede do fuso está adiantado em relação ao UTC, em
 * milissegundos, no instante dado.
 *
 * Calculado pelo `Intl` em vez de fixado em -3h: o Brasil pode voltar a ter
 * horário de verão, e uma constante silenciosamente erraria uma hora em todos
 * os agendamentos daquele período.
 */
function deslocamento(instante: Date): number {
  const formatador = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const partes = Object.fromEntries(
    formatador.formatToParts(instante).map((p) => [p.type, p.value]),
  );

  const comoUtc = Date.UTC(
    Number(partes.year),
    Number(partes.month) - 1,
    Number(partes.day),
    // O Intl devolve 24 para meia-noite com hour12: false
    Number(partes.hour) % 24,
    Number(partes.minute),
    Number(partes.second),
  );

  return comoUtc - instante.getTime();
}

/**
 * O instante em que o relógio do escritório marca esta data e hora.
 *
 * Duas passadas: a primeira usa um palpite para descobrir o deslocamento
 * daquele momento, a segunda corrige. Uma passada só erraria justamente nos
 * dias de virada do horário de verão.
 */
function instanteLocal(
  ano: number,
  mes: number,
  dia: number,
  hora: number,
  minuto: number,
): Date {
  const palpite = Date.UTC(ano, mes - 1, dia, hora, minuto);
  const ajustado = palpite - deslocamento(new Date(palpite));

  return new Date(palpite - deslocamento(new Date(ajustado)));
}

/** "09:30" para minutos desde a meia-noite. */
function emMinutos(hora: string | null): number | null {
  if (!hora) return null;

  const [h, m] = hora.split(':');
  const horas = Number(h);
  const minutos = Number(m ?? 0);

  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return null;

  return horas * 60 + minutos;
}

@Injectable()
export class DisponibilidadeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Horários livres de uma agenda num dia.
   *
   * Existe porque a configuração de dias e turnos estava no banco desde o
   * começo e ninguém a consultava: dava para marcar um compromisso às três da
   * manhã de domingo, ou dois no mesmo horário, e o sistema aceitava os dois.
   */
  async doDia(
    officeId: string,
    calendarId: string,
    dataIso: string,
    duracaoMinutos = DURACAO_PADRAO_MINUTOS,
  ): Promise<{
    date: string;
    calendarId: string;
    duracaoMinutos: number;
    slots: Horario[];
  }> {
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataIso);

    if (!partes) {
      throw new BadRequestException('Informe a data no formato AAAA-MM-DD');
    }

    const ano = Number(partes[1]);
    const mes = Number(partes[2]);
    const dia = Number(partes[3]);

    const agenda = await this.prisma.calendar.findFirst({
      // officeId no where, não só o id: buscar apenas por id devolveria a
      // agenda de outro escritório
      where: { id: calendarId, officeId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!agenda) throw new NotFoundException('Agenda não encontrada');

    const vazio = {
      date: dataIso,
      calendarId,
      duracaoMinutos,
      slots: [] as Horario[],
    };

    // Agenda desativada não oferece horário — e é diferente de agenda sem
    // horário configurado, ainda que a tela mostre as duas como vazias.
    if (!agenda.status) return vazio;

    const diaDaSemana = DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];

    const configuracao = await this.prisma.calendarAvailableDay.findUnique({
      where: {
        calendarId_day: { calendarId, day: diaDaSemana as Weekday },
      },
    });

    if (!configuracao) return vazio;

    const turnos = [
      {
        de: emMinutos(configuracao.available ? configuracao.startTime : null),
        ate: emMinutos(configuracao.available ? configuracao.endTime : null),
        online: configuracao.online,
        inPerson: configuracao.inPerson,
      },
      {
        de: emMinutos(
          configuracao.shift2Available ? configuracao.shift2StartTime : null,
        ),
        ate: emMinutos(
          configuracao.shift2Available ? configuracao.shift2EndTime : null,
        ),
        online: configuracao.shift2Online,
        inPerson: configuracao.shift2InPerson,
      },
    ];

    const candidatos: Horario[] = [];

    for (const turno of turnos) {
      if (turno.de === null || turno.ate === null || turno.ate <= turno.de) {
        continue;
      }

      for (
        let minuto = turno.de;
        minuto + duracaoMinutos <= turno.ate;
        minuto += duracaoMinutos
      ) {
        candidatos.push({
          inicio: instanteLocal(ano, mes, dia, 0, minuto),
          fim: instanteLocal(ano, mes, dia, 0, minuto + duracaoMinutos),
          online: turno.online,
          inPerson: turno.inPerson,
        });
      }
    }

    if (candidatos.length === 0) return vazio;

    const ocupados = await this.prisma.event.findMany({
      where: {
        officeId,
        calendarId,
        deletedAt: null,
        status: { not: EventStatus.CANCEL },
        // Só o que cruza a janela do dia inteiro — um compromisso da semana
        // que vem não tem por que ser lido aqui.
        startTime: { lt: candidatos[candidatos.length - 1]?.fim },
        endTime: { gt: candidatos[0]?.inicio },
      },
      select: { startTime: true, endTime: true },
    });

    return {
      ...vazio,
      slots: candidatos.filter(
        (horario) =>
          !ocupados.some(
            (evento) =>
              evento.startTime < horario.fim && evento.endTime > horario.inicio,
          ),
      ),
    };
  }

  /**
   * Compromisso já marcado que cruza esta janela na mesma agenda.
   *
   * Sobreposição é `inicio < fimExistente && fim > inicioExistente`. Comparar
   * só o início deixaria passar um compromisso de duas horas começando meia
   * hora antes — que é exatamente o conflito mais comum.
   */
  async conflito(
    officeId: string,
    calendarId: string,
    inicio: Date,
    fim: Date,
    ignorarEventoId?: string,
  ): Promise<{ id: string; title: string; startTime: Date } | null> {
    return this.prisma.event.findFirst({
      where: {
        officeId,
        calendarId,
        deletedAt: null,
        status: { not: EventStatus.CANCEL },
        startTime: { lt: fim },
        endTime: { gt: inicio },
        ...(ignorarEventoId && { id: { not: ignorarEventoId } }),
      },
      select: { id: true, title: true, startTime: true },
    });
  }
}

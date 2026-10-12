import { Injectable } from '@nestjs/common';
import {
  ChatStatus,
  EventStatus,
  EventType,
  MessageSender,
  StageKind,
} from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { montarPeriodo, periodoAnterior } from '@/modules/ai-usage/periodo';

export type JanelaDoInicio = 'semana' | 'mes' | 'trimestre';

const DIAS_DA_JANELA: Record<JanelaDoInicio, number> = {
  semana: 7,
  mes: 30,
  trimestre: 90,
};

const DIA_MS = 24 * 60 * 60 * 1000;
const MAX_AGUARDANDO = 5;

/** Compromissos que contam como "consulta marcada" — prazo não é consulta. */
const TIPOS_DE_ATENDIMENTO = [
  EventType.INQUIRY,
  EventType.SERVICE,
  EventType.MEETING,
  EventType.CALL,
];

function hojeEmBrasilia(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function somarDias(dia: string, dias: number): string {
  const data = new Date(`${dia}T12:00:00Z`);
  return new Date(data.getTime() + dias * DIA_MS).toISOString().slice(0, 10);
}

/**
 * A tela de Início: o que aconteceu desde a meia-noite, quem espera
 * resposta, o dia de hoje e os números do período.
 *
 * O "resumo da manhã" é montado na tela a partir destes números — não passa
 * por modelo de IA. Um texto gerado poderia arredondar, inventar ou errar um
 * nome; aqui cada número sai de uma contagem.
 */
@Injectable()
export class InicioService {
  constructor(private readonly prisma: PrismaService) {}

  async montar(officeId: string, janela: JanelaDoInicio = 'semana') {
    const hoje = hojeEmBrasilia();
    const madrugada = montarPeriodo(hoje, hoje);
    const periodo = montarPeriodo(
      somarDias(hoje, -(DIAS_DA_JANELA[janela] - 1)),
      hoje,
    );
    const anterior = periodoAnterior(periodo);
    const proximaSemana = montarPeriodo(hoje, somarDias(hoje, 7));

    const [
      atendidosHoje,
      consultasHoje,
      aguardando,
      leadsNovos,
      leadsNovosAnterior,
      atendidos,
      consultas,
      ganhos,
      serieLeads,
      serieAtendidos,
      agenda,
      prazos,
    ] = await Promise.all([
      this.conversasAtendidas(officeId, madrugada.inicio, madrugada.fim),
      this.consultasMarcadas(officeId, madrugada.inicio, madrugada.fim),
      this.aguardando(officeId),
      this.prisma.lead.count({
        where: {
          officeId,
          deletedAt: null,
          createdAt: { gte: periodo.inicio, lt: periodo.fim },
        },
      }),
      this.prisma.lead.count({
        where: {
          officeId,
          deletedAt: null,
          createdAt: { gte: anterior.inicio, lt: anterior.fim },
        },
      }),
      this.conversasAtendidas(officeId, periodo.inicio, periodo.fim),
      this.consultasMarcadas(officeId, periodo.inicio, periodo.fim),
      this.ganhos(officeId, periodo.inicio, periodo.fim),
      this.seriePorDia(officeId, 'leads', periodo.inicio, periodo.fim),
      this.seriePorDia(officeId, 'atendidos', periodo.inicio, periodo.fim),
      this.agendaDe(officeId, madrugada.inicio, madrugada.fim),
      this.prisma.event.findMany({
        where: {
          officeId,
          deletedAt: null,
          type: EventType.DEADLINE,
          status: { not: EventStatus.CANCEL },
          startTime: { gte: proximaSemana.inicio, lt: proximaSemana.fim },
        },
        select: { id: true, title: true, startTime: true },
        orderBy: { startTime: 'asc' },
        take: 4,
      }),
    ]);

    const preencher = (serie: Map<string, number>) =>
      periodo.dias.map((dia) => serie.get(dia) ?? 0);

    return {
      dia: hoje,
      madrugada: {
        atendidos: atendidosHoje,
        consultasMarcadas: consultasHoje,
      },
      aguardando,
      periodo: {
        janela,
        de: periodo.de,
        ate: periodo.ate,
        leadsNovos,
        leadsNovosAnterior,
        atendidos,
        consultas,
        honorarios: ganhos.valor,
        contratos: ganhos.contratos,
        serieLeads: preencher(serieLeads),
        serieAtendidos: preencher(serieAtendidos),
      },
      agenda,
      prazos: prazos.map((p) => ({
        id: p.id,
        titulo: p.title,
        data: p.startTime,
      })),
    };
  }

  /** Conversas em que a assistente respondeu ao menos uma vez no intervalo. */
  private async conversasAtendidas(
    officeId: string,
    de: Date,
    ate: Date,
  ): Promise<number> {
    const linhas = await this.prisma.message.groupBy({
      by: ['chatId'],
      where: {
        officeId,
        deletedAt: null,
        sender: MessageSender.AGENT,
        createdAt: { gte: de, lt: ate },
      },
    });
    return linhas.length;
  }

  private consultasMarcadas(
    officeId: string,
    de: Date,
    ate: Date,
  ): Promise<number> {
    return this.prisma.event.count({
      where: {
        officeId,
        deletedAt: null,
        type: { in: TIPOS_DE_ATENDIMENTO },
        status: { not: EventStatus.CANCEL },
        createdAt: { gte: de, lt: ate },
      },
    });
  }

  /**
   * Conversas com a equipe em que quem falou por último foi o contato.
   *
   * A mais antiga primeiro: é quem espera há mais tempo.
   */
  private async aguardando(officeId: string) {
    const conversas = await this.prisma.chat.findMany({
      where: { officeId, deletedAt: null, status: ChatStatus.PENDING },
      select: {
        id: true,
        userName: true,
        lead: {
          select: {
            name: true,
            stage: { select: { name: true, color: true } },
          },
        },
        customer: { select: { name: true } },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            sender: true,
            type: true,
            messageText: true,
            messageCaption: true,
            createdAt: true,
          },
        },
      },
      orderBy: { lastActivityAt: 'asc' },
    });

    const esperando = conversas
      .map((c) => ({ c, ultima: c.messages[0] }))
      .filter(
        ({ ultima }) =>
          ultima?.sender === MessageSender.LEAD ||
          ultima?.sender === MessageSender.CUSTOMER,
      )
      .sort(
        (a, b) =>
          (a.ultima?.createdAt.getTime() ?? 0) -
          (b.ultima?.createdAt.getTime() ?? 0),
      );

    return {
      total: esperando.length,
      itens: esperando.slice(0, MAX_AGUARDANDO).map(({ c, ultima }) => ({
        chatId: c.id,
        nome:
          c.customer?.name ?? c.lead?.name ?? c.userName ?? 'Contato sem nome',
        ultimaMensagem: ultima?.messageText ?? ultima?.messageCaption ?? null,
        tipo: ultima?.type ?? null,
        desde: ultima?.createdAt ?? null,
        etapa: c.lead?.stage ?? null,
      })),
    };
  }

  /** Leads que chegaram a uma etapa de ganho no período, e o valor deles. */
  private async ganhos(officeId: string, de: Date, ate: Date) {
    const passagens = await this.prisma.leadStageHistory.findMany({
      where: {
        officeId,
        createdAt: { gte: de, lt: ate },
        toStage: { kind: StageKind.WON },
      },
      distinct: ['leadId'],
      select: { lead: { select: { value: true } } },
    });

    return {
      contratos: passagens.length,
      valor: passagens.reduce((t, p) => t + Number(p.lead.value ?? 0), 0),
    };
  }

  private async agendaDe(officeId: string, de: Date, ate: Date) {
    const eventos = await this.prisma.event.findMany({
      where: {
        officeId,
        deletedAt: null,
        status: { not: EventStatus.CANCEL },
        startTime: { gte: de, lt: ate },
      },
      select: {
        id: true,
        title: true,
        type: true,
        startTime: true,
        endTime: true,
        lead: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 8,
    });

    return eventos.map((e) => ({
      id: e.id,
      titulo: e.title,
      tipo: e.type,
      inicio: e.startTime,
      fim: e.endTime,
      contato: e.customer?.name ?? e.lead?.name ?? null,
    }));
  }

  /** Um valor por dia, no fuso de Brasília, para os minigráficos. */
  private async seriePorDia(
    officeId: string,
    qual: 'leads' | 'atendidos',
    de: Date,
    ate: Date,
  ): Promise<Map<string, number>> {
    const linhas =
      qual === 'leads'
        ? await this.prisma.$queryRaw<{ dia: string; total: number }[]>`
            SELECT to_char((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS dia,
                   COUNT(*)::int AS total
              FROM leads
             WHERE office_id = ${officeId}::uuid
               AND deleted_at IS NULL
               AND (created_at AT TIME ZONE 'UTC') >= ${de}
               AND (created_at AT TIME ZONE 'UTC') < ${ate}
             GROUP BY 1`
        : await this.prisma.$queryRaw<{ dia: string; total: number }[]>`
            SELECT to_char((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS dia,
                   COUNT(DISTINCT chat_id)::int AS total
              FROM messages
             WHERE office_id = ${officeId}::uuid
               AND deleted_at IS NULL
               AND sender = 'agent'
               AND (created_at AT TIME ZONE 'UTC') >= ${de}
               AND (created_at AT TIME ZONE 'UTC') < ${ate}
             GROUP BY 1`;

    return new Map(linhas.map((l) => [l.dia, Number(l.total)]));
  }
}

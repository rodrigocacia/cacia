import { Injectable } from '@nestjs/common';
import { ChatStatus, ProcessStatus } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';

export interface ResumoDoEscritorio {
  summary: {
    chats: number;
    leads: number;
    customers: number;
    processes: number;
  };
  processStatus: { status: string; total: number }[];
  processType: { type: string; total: number }[];
  lastProcesses: {
    id: string;
    number: string;
    description: string | null;
    status: ProcessStatus;
    type: string | null;
    lastActivityAt: Date | null;
    createdAt: Date;
    customer: { id: string; name: string; document: string } | null;
  }[];
}

/** Quantos processos recentes a tela inicial mostra. */
const PROCESSOS_RECENTES = 5;

/**
 * Números da tela inicial.
 *
 * Todas as contagens vão em uma rodada de `Promise.all`: são independentes, e
 * em série somariam a latência de cada uma numa tela que é a primeira coisa
 * que o usuário vê.
 *
 * O recorte por data é opcional e afeta só o que faz sentido recortar — o
 * total de clientes do escritório não muda por causa de um filtro de período,
 * mas os processos abertos no período, sim.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(
    officeId: string,
    periodo: { de?: Date; ate?: Date } = {},
  ): Promise<ResumoDoEscritorio> {
    const criadoEm = this.filtroDePeriodo(periodo);
    const base = { officeId, deletedAt: null };
    const baseComPeriodo = {
      ...base,
      ...(criadoEm && { createdAt: criadoEm }),
    };

    const [chats, leads, customers, processes, porStatus, porTipo, ultimos] =
      await Promise.all([
        this.prisma.chat.count({
          where: { ...base, status: ChatStatus.ACTIVE },
        }),
        this.prisma.lead.count({ where: baseComPeriodo }),
        this.prisma.customer.count({ where: baseComPeriodo }),
        this.prisma.process.count({ where: baseComPeriodo }),

        this.prisma.process.groupBy({
          by: ['status'],
          where: baseComPeriodo,
          _count: { _all: true },
        }),

        this.prisma.process.groupBy({
          by: ['type'],
          where: baseComPeriodo,
          _count: { _all: true },
        }),

        this.prisma.process.findMany({
          where: base,
          select: {
            id: true,
            number: true,
            description: true,
            status: true,
            type: true,
            lastActivityAt: true,
            createdAt: true,
            customer: { select: { id: true, name: true, document: true } },
          },
          // Movimentação mais recente primeiro; o que nunca movimentou vai
          // pelo cadastro, para que a lista nunca fique vazia
          orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
          take: PROCESSOS_RECENTES,
        }),
      ]);

    return {
      summary: { chats, leads, customers, processes },
      processStatus: porStatus.map((linha) => ({
        status: linha.status,
        total: linha._count._all,
      })),
      processType: porTipo
        .filter((linha) => linha.type !== null)
        .map((linha) => ({
          type: linha.type as string,
          total: linha._count._all,
        })),
      lastProcesses: ultimos,
    };
  }

  private filtroDePeriodo({ de, ate }: { de?: Date; ate?: Date }) {
    if (!de && !ate) return undefined;

    return {
      ...(de && { gte: de }),
      ...(ate && { lte: ate }),
    };
  }
}

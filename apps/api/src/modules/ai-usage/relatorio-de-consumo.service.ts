import { Injectable, NotFoundException } from '@nestjs/common';
import { AiTask, MessageSender, Prisma } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ConsumoDeIaService } from '@/ai/consumo/consumo-de-ia.service';
import { montarPeriodo, periodoAnterior, type Periodo } from './periodo';

/**
 * Como o consumo aparece para quem lê: três grupos que o escritório entende,
 * em vez das quatro tarefas técnicas.
 */
const CATEGORIAS = [
  {
    chave: 'atendimento',
    rotulo: 'Atendimento',
    descricao: 'Respostas da IA aos contatos no WhatsApp',
    tarefas: [AiTask.ATTENDANCE],
  },
  {
    chave: 'memoria',
    rotulo: 'Memória das conversas',
    descricao: 'Resumos e anotações que a IA guarda sobre cada contato',
    tarefas: [AiTask.SUMMARY, AiTask.FACTS],
  },
  {
    chave: 'busca',
    rotulo: 'Busca em documentos',
    descricao: 'Leitura dos documentos e consultas à base do escritório',
    tarefas: [AiTask.EMBEDDING],
  },
] as const;

interface Somas {
  custo: number;
  chamadas: number;
  tokens: number;
}

const arredondar = (valor: number) => Math.round(valor * 10_000) / 10_000;

@Injectable()
export class RelatorioDeConsumoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consumo: ConsumoDeIaService,
  ) {}

  // ---- escritório ----------------------------------------------------------

  /**
   * O relatório que o escritório vê: só o valor cobrado.
   *
   * Custo, margem e câmbio são do operador da plataforma e não saem daqui.
   */
  async doEscritorio(officeId: string, de?: string, ate?: string) {
    const completo = await this.detalheDoEscritorio(officeId, de, ate);

    return {
      periodo: completo.periodo,
      total: completo.total.cobrado,
      totalAnterior: completo.totalAnterior.cobrado,
      variacaoPercentual: completo.variacaoPercentual,
      conversasAtendidas: completo.conversasAtendidas,
      respostasDaIa: completo.respostasDaIa,
      valorMedioPorResposta: completo.valorMedioPorResposta.cobrado,
      categorias: completo.categorias.map((c) => ({
        chave: c.chave,
        rotulo: c.rotulo,
        descricao: c.descricao,
        valor: c.cobrado,
        chamadas: c.chamadas,
        tokens: c.tokens,
        percentual: c.percentual,
      })),
      porDia: completo.porDia.map((d) => ({ dia: d.dia, valor: d.cobrado })),
    };
  }

  // ---- administração --------------------------------------------------------

  /** Detalhe de um escritório para o painel: custo, margem e valor cobrado. */
  async detalheDoEscritorio(officeId: string, de?: string, ate?: string) {
    const periodo = montarPeriodo(de, ate);
    const anterior = periodoAnterior(periodo);
    const margem = await this.margem();
    const cobrar = (custo: number) => arredondar(custo * (1 + margem / 100));

    const onde = this.filtro(periodo, officeId);

    const [
      porTarefa,
      somaAnterior,
      porDia,
      conversas,
      respostas,
      porModelo,
      naReserva,
    ] = await Promise.all([
      this.prisma.aiUsage.groupBy({
        by: ['task'],
        where: onde,
        _sum: { costBrl: true, inputTokens: true, outputTokens: true },
        _count: { _all: true },
      }),
      this.prisma.aiUsage.aggregate({
        where: this.filtro(anterior, officeId),
        _sum: { costBrl: true },
      }),
      this.porDia(periodo, officeId),
      this.prisma.aiUsage.groupBy({
        by: ['chatId'],
        where: { ...onde, task: AiTask.ATTENDANCE, chatId: { not: null } },
      }),
      this.prisma.message.count({
        where: {
          officeId,
          sender: MessageSender.AGENT,
          deletedAt: null,
          createdAt: { gte: periodo.inicio, lt: periodo.fim },
        },
      }),
      this.prisma.aiUsage.groupBy({
        by: ['provider', 'model', 'priced'],
        where: onde,
        _sum: {
          costBrl: true,
          inputTokens: true,
          cachedInputTokens: true,
          outputTokens: true,
        },
        _count: { _all: true },
        orderBy: { _sum: { costBrl: 'desc' } },
      }),
      this.prisma.aiUsage.count({ where: { ...onde, fallback: true } }),
    ]);

    const somasPorTarefa = new Map<AiTask, Somas>(
      porTarefa.map((linha) => [
        linha.task,
        {
          custo: Number(linha._sum.costBrl ?? 0),
          chamadas: linha._count._all,
          tokens:
            (linha._sum.inputTokens ?? 0) + (linha._sum.outputTokens ?? 0),
        },
      ]),
    );

    const custoTotal = [...somasPorTarefa.values()].reduce(
      (t, s) => t + s.custo,
      0,
    );
    const custoAnterior = Number(somaAnterior._sum.costBrl ?? 0);

    const categorias = CATEGORIAS.map((categoria) => {
      const somas = categoria.tarefas.reduce<Somas>(
        (t, tarefa) => {
          const s = somasPorTarefa.get(tarefa);
          return s
            ? {
                custo: t.custo + s.custo,
                chamadas: t.chamadas + s.chamadas,
                tokens: t.tokens + s.tokens,
              }
            : t;
        },
        { custo: 0, chamadas: 0, tokens: 0 },
      );

      return {
        chave: categoria.chave,
        rotulo: categoria.rotulo,
        descricao: categoria.descricao,
        custo: arredondar(somas.custo),
        cobrado: cobrar(somas.custo),
        chamadas: somas.chamadas,
        tokens: somas.tokens,
        percentual:
          custoTotal > 0 ? Math.round((somas.custo / custoTotal) * 100) : 0,
      };
    });

    return {
      periodo: { de: periodo.de, ate: periodo.ate },
      margemPercentual: margem,
      total: { custo: arredondar(custoTotal), cobrado: cobrar(custoTotal) },
      totalAnterior: {
        custo: arredondar(custoAnterior),
        cobrado: cobrar(custoAnterior),
      },
      variacaoPercentual:
        custoAnterior > 0
          ? Math.round(((custoTotal - custoAnterior) / custoAnterior) * 1000) /
            10
          : null,
      conversasAtendidas: conversas.length,
      respostasDaIa: respostas,
      valorMedioPorResposta: {
        custo: respostas > 0 ? arredondar(custoTotal / respostas) : 0,
        cobrado: respostas > 0 ? cobrar(custoTotal / respostas) : 0,
      },
      categorias,
      porDia: porDia.map((d) => ({
        dia: d.dia,
        custo: arredondar(d.custo),
        cobrado: cobrar(d.custo),
      })),
      porModelo: porModelo.map((linha) => ({
        provedor: linha.provider,
        modelo: linha.model,
        semPreco: !linha.priced,
        chamadas: linha._count._all,
        tokensEntrada: linha._sum.inputTokens ?? 0,
        tokensEmCache: linha._sum.cachedInputTokens ?? 0,
        tokensSaida: linha._sum.outputTokens ?? 0,
        custo: arredondar(Number(linha._sum.costBrl ?? 0)),
      })),
      chamadasNaReserva: naReserva,
    };
  }

  /** Todos os escritórios no período: a lista de cobrança do mês. */
  async visaoGeral(de?: string, ate?: string) {
    const periodo = montarPeriodo(de, ate);
    const margem = await this.margem();
    const cobrar = (custo: number) => arredondar(custo * (1 + margem / 100));

    const [porEscritorio, semPreco] = await Promise.all([
      this.prisma.aiUsage.groupBy({
        by: ['officeId'],
        where: this.filtro(periodo),
        _sum: { costBrl: true, inputTokens: true, outputTokens: true },
        _count: { _all: true },
        orderBy: { _sum: { costBrl: 'desc' } },
      }),
      this.prisma.aiUsage.groupBy({
        by: ['officeId'],
        where: { ...this.filtro(periodo), priced: false },
      }),
    ]);

    const escritorios = await this.prisma.office.findMany({
      where: { id: { in: porEscritorio.map((l) => l.officeId) } },
      select: { id: true, name: true, tradeName: true, deletedAt: true },
    });
    const nomes = new Map(escritorios.map((e) => [e.id, e]));
    const comModeloSemPreco = new Set(semPreco.map((l) => l.officeId));

    const linhas = porEscritorio.map((l) => {
      const custo = Number(l._sum.costBrl ?? 0);
      const escritorio = nomes.get(l.officeId);

      return {
        officeId: l.officeId,
        nome:
          escritorio?.tradeName ?? escritorio?.name ?? 'Escritório removido',
        removido: Boolean(escritorio?.deletedAt),
        chamadas: l._count._all,
        tokens: (l._sum.inputTokens ?? 0) + (l._sum.outputTokens ?? 0),
        custo: arredondar(custo),
        cobrado: cobrar(custo),
        semPreco: comModeloSemPreco.has(l.officeId),
      };
    });

    const custoTotal = linhas.reduce((t, l) => t + l.custo, 0);

    return {
      periodo: { de: periodo.de, ate: periodo.ate },
      margemPercentual: margem,
      total: { custo: arredondar(custoTotal), cobrado: cobrar(custoTotal) },
      escritorios: linhas,
    };
  }

  async garantirEscritorio(officeId: string): Promise<void> {
    const existe = await this.prisma.office.findUnique({
      where: { id: officeId },
      select: { id: true },
    });
    if (!existe) throw new NotFoundException('Escritório não encontrado');
  }

  // ---- parâmetros de cobrança ----------------------------------------------

  async parametros() {
    const [ajustes, precos] = await Promise.all([
      this.ajustes(),
      this.prisma.aiModelPrice.findMany({ orderBy: { model: 'asc' } }),
    ]);

    return {
      margemPercentual: Number(ajustes.markupPercent),
      cambio: Number(ajustes.usdToBrl),
      precos: precos.map((p) => ({
        modelo: p.model,
        entradaUsdPorMilhao: Number(p.inputUsdPerMillion),
        entradaEmCacheUsdPorMilhao: Number(p.cachedInputUsdPerMillion),
        saidaUsdPorMilhao: Number(p.outputUsdPerMillion),
        atualizadoEm: p.updatedAt,
      })),
    };
  }

  /**
   * A margem vale para qualquer período consultado, inclusive os passados: é
   * o preço de venda. O câmbio, ao contrário, só vale daqui para a frente —
   * o custo em reais foi fixado no momento de cada chamada.
   */
  async atualizarParametros(dados: {
    margemPercentual?: number;
    cambio?: number;
  }) {
    await this.prisma.aiBillingSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        markupPercent: dados.margemPercentual ?? 0,
        usdToBrl: dados.cambio ?? 5.5,
      },
      update: {
        ...(dados.margemPercentual !== undefined && {
          markupPercent: dados.margemPercentual,
        }),
        ...(dados.cambio !== undefined && { usdToBrl: dados.cambio }),
      },
    });

    this.consumo.esquecerTabela();
    return this.parametros();
  }

  /** Cria ou altera o preço de um modelo. Vale para as próximas chamadas. */
  async salvarPreco(
    modelo: string,
    preco: {
      entradaUsdPorMilhao: number;
      entradaEmCacheUsdPorMilhao: number;
      saidaUsdPorMilhao: number;
    },
  ) {
    const dados = {
      inputUsdPerMillion: preco.entradaUsdPorMilhao,
      cachedInputUsdPerMillion: preco.entradaEmCacheUsdPorMilhao,
      outputUsdPerMillion: preco.saidaUsdPorMilhao,
    };

    await this.prisma.aiModelPrice.upsert({
      where: { model: modelo },
      create: { model: modelo, ...dados },
      update: dados,
    });

    this.consumo.esquecerTabela();
    return this.parametros();
  }

  async removerPreco(modelo: string) {
    await this.prisma.aiModelPrice.deleteMany({ where: { model: modelo } });
    this.consumo.esquecerTabela();
    return this.parametros();
  }

  // ---- auxiliares -----------------------------------------------------------

  private filtro(periodo: Periodo, officeId?: string) {
    return {
      ...(officeId && { officeId }),
      createdAt: { gte: periodo.inicio, lt: periodo.fim },
    };
  }

  private async ajustes() {
    return (
      (await this.prisma.aiBillingSettings.findUnique({
        where: { id: 1 },
      })) ?? {
        markupPercent: new Prisma.Decimal(0),
        usdToBrl: new Prisma.Decimal(5.5),
      }
    );
  }

  private async margem(): Promise<number> {
    return Number((await this.ajustes()).markupPercent);
  }

  /**
   * Um valor por dia do período, inclusive os dias sem consumo: o gráfico
   * precisa das barras vazias para mostrar o ritmo real.
   */
  private async porDia(
    periodo: Periodo,
    officeId: string,
  ): Promise<{ dia: string; custo: number }[]> {
    const linhas = await this.prisma.$queryRaw<
      { dia: string; custo: number }[]
    >`
      SELECT to_char((created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS dia,
             SUM(cost_brl)::float8 AS custo
        FROM ai_usage
       WHERE office_id = ${officeId}::uuid
         -- A coluna guarda UTC sem fuso. Comparar direto com o parâmetro
         -- (que tem fuso) usaria o fuso da sessão do banco: num Postgres em
         -- horário de Brasília, o dia começaria três horas errado.
         AND (created_at AT TIME ZONE 'UTC') >= ${periodo.inicio}
         AND (created_at AT TIME ZONE 'UTC') < ${periodo.fim}
       GROUP BY 1`;

    const porData = new Map(linhas.map((l) => [l.dia, Number(l.custo)]));

    return periodo.dias.map((dia) => ({ dia, custo: porData.get(dia) ?? 0 }));
  }
}

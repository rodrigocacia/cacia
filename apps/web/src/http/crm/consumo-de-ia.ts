import { apiCrm } from "../api-crm"

/**
 * Consumo de IA do escritório.
 *
 * Os valores já vêm em reais, no preço cobrado do escritório. A tela não tem
 * (e não deve ter) acesso a custo de provedor nem margem — é isso que ela
 * mostra ao cliente.
 */

export type ChaveDaCategoria = "atendimento" | "memoria" | "busca"

export interface CategoriaDeConsumo {
  chave: ChaveDaCategoria
  rotulo: string
  descricao: string
  valor: number
  chamadas: number
  tokens: number
  percentual: number
}

export interface ConsumoDoDia {
  /** YYYY-MM-DD, no fuso de Brasília. */
  dia: string
  valor: number
}

export interface ConsumoDeIa {
  periodo: { de: string; ate: string }
  total: number
  /** Total do período de mesmo tamanho imediatamente anterior. */
  totalAnterior: number
  /** Nulo quando o período anterior não teve consumo: não há base de comparação. */
  variacaoPercentual: number | null
  conversasAtendidas: number
  respostasDaIa: number
  valorMedioPorResposta: number
  categorias: CategoriaDeConsumo[]
  /** Um item por dia do período, inclusive os dias sem consumo. */
  porDia: ConsumoDoDia[]
}

/** Sem datas, a API assume o mês corrente até hoje. */
export interface PeriodoDoConsumo {
  de?: string
  ate?: string
}

export function buscarConsumoDeIa(
  periodo: PeriodoDoConsumo = {}
): Promise<ConsumoDeIa> {
  const query = new URLSearchParams()

  if (periodo.de) query.set("from", periodo.de)
  if (periodo.ate) query.set("to", periodo.ate)

  return apiCrm.get("ai-usage", { searchParams: query }).json<ConsumoDeIa>()
}

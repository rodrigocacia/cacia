/**
 * Formatação e escala da tela de consumo de IA.
 *
 * Funções puras, fora do componente, para poderem ser testadas sem montar a
 * tela — ver consumo-de-ia.spec.ts.
 */

const REAIS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

// Uma resposta da IA custa frações de centavo. Com duas casas, o valor médio
// por resposta apareceria como "R$ 0,00", como se fosse de graça.
const REAIS_MIUDOS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumSignificantDigits: 2,
})

const INTEIRO = new Intl.NumberFormat("pt-BR")

export function formatarReais(valor: number): string {
  const absoluto = Math.abs(valor)

  if (absoluto > 0 && absoluto < 0.01) return REAIS_MIUDOS.format(valor)

  return REAIS.format(valor)
}

export function formatarInteiro(valor: number): string {
  return INTEIRO.format(valor)
}

/** "+12,5%", "-3%", ou nulo quando não há base de comparação. */
export function formatarVariacao(variacao: number | null): string | null {
  if (variacao === null) return null

  // Acima de 100% a casa decimal só polui: "+1.803,3%" não diz mais que "+1.803%"
  const formato = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: Math.abs(variacao) >= 100 ? 0 : 1,
    signDisplay: "exceptZero",
  })

  return `${formato.format(variacao)}%`
}

/** YYYY-MM-DD → DD/MM/AAAA, sem passar por Date (que aplicaria fuso). */
export function formatarData(dia: string): string {
  const [ano, mes, dd] = dia.split("-")
  return `${dd}/${mes}/${ano}`
}

/** Rótulo do eixo: só o dia em períodos de até um mês, DD/MM nos maiores. */
export function rotuloDoDia(dia: string, totalDeDias: number): string {
  const [, mes, dd] = dia.split("-")
  return totalDeDias <= 31 ? dd : `${dd}/${mes}`
}

/** De quantos em quantos dias o eixo mostra rótulo, para não encavalar. */
export function passoDosRotulos(totalDeDias: number): number {
  if (totalDeDias <= 31) return 1
  if (totalDeDias <= 92) return 7
  return 30
}

/**
 * Hoje no fuso de Brasília, em YYYY-MM-DD.
 *
 * É o fuso em que a API fecha os dias. Usar o do navegador faria "mês
 * passado" começar num dia diferente para quem acessa de fora do país, ou
 * perto da meia-noite.
 */
export function hojeEmBrasilia(agora: Date = new Date()): string {
  // en-CA formata como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(agora)
}

/** Do primeiro ao último dia do mês anterior ao de `hoje` (YYYY-MM-DD). */
export function intervaloDoMesPassado(hoje: string): {
  de: string
  ate: string
} {
  const [ano, mes] = hoje.split("-").map(Number)

  // Dia 0 do mês corrente é o último dia do anterior; Date.UTC resolve a
  // virada de ano sozinho.
  const ultimo = new Date(Date.UTC(ano, mes - 1, 0))
  const anoAnterior = ultimo.getUTCFullYear()
  const mesAnterior = String(ultimo.getUTCMonth() + 1).padStart(2, "0")
  const ultimoDia = String(ultimo.getUTCDate()).padStart(2, "0")

  return {
    de: `${anoAnterior}-${mesAnterior}-01`,
    ate: `${anoAnterior}-${mesAnterior}-${ultimoDia}`,
  }
}

/**
 * Escala do eixo Y: um topo "redondo" acima do maior valor e as marcas das
 * linhas de grade.
 *
 * Escalar direto pelo máximo deixaria a barra mais alta colada no teto e as
 * linhas de grade em valores como R$ 0,2963, que ninguém lê.
 */
export function escalaDoGrafico(
  maximo: number,
  divisoes = 4
): { topo: number; marcas: number[] } {
  if (!(maximo > 0)) return { topo: 0, marcas: [0] }

  const bruto = maximo / divisoes
  const magnitude = 10 ** Math.floor(Math.log10(bruto))
  const normalizado = bruto / magnitude

  const fator =
    normalizado <= 1
      ? 1
      : normalizado <= 2
        ? 2
        : normalizado <= 2.5
          ? 2.5
          : normalizado <= 5
            ? 5
            : 10

  const passo = fator * magnitude
  // A tolerância evita uma divisão a mais quando o máximo cai exatamente
  // numa marca e a conta de ponto flutuante devolve 3.0000000001.
  const quantidade = Math.max(1, Math.ceil(maximo / passo - 1e-9))
  const marcas = Array.from({ length: quantidade + 1 }, (_, i) =>
    Number((i * passo).toFixed(10))
  )

  return { topo: marcas[marcas.length - 1], marcas }
}

/** Altura da barra em % do topo. Valor positivo nunca some por arredondamento. */
export function alturaDaBarra(valor: number, topo: number): number {
  if (!(topo > 0) || !(valor > 0)) return 0
  return Math.max(2, Math.min(100, (valor / topo) * 100))
}

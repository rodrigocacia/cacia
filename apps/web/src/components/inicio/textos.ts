import type { ConversaAguardando, DadosDoInicio } from "@/http/crm/inicio"

/** Títulos que não são o primeiro nome de ninguém. */
const TITULOS = new Set([
  "dr",
  "dr.",
  "dra",
  "dra.",
  "sr",
  "sr.",
  "sra",
  "sra.",
])

export function primeiroNome(nome?: string | null): string {
  const partes = (nome ?? "").split(/\s+/).filter(Boolean)
  const nomeReal = partes.find((p) => !TITULOS.has(p.toLowerCase()))
  return nomeReal ?? ""
}

export function saudacao(agora = new Date()): string {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }).format(agora)
  )
  if (hora < 12) return "Bom dia"
  if (hora < 18) return "Boa tarde"
  return "Boa noite"
}

/** "12 min", "3 h", "2 d": quanto a pessoa está esperando. */
export function espera(desde: string | null, agora = Date.now()): string {
  if (!desde) return ""
  const minutos = Math.max(1, Math.round((agora - Date.parse(desde)) / 60000))
  if (minutos < 60) return `${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `${horas} h`
  return `${Math.round(horas / 24)} d`
}

function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`
}

export interface TrechoDoResumo {
  texto: string
  destaque?: "forte" | "alerta"
}

/**
 * O resumo da manhã, em frases, a partir das contagens.
 *
 * Montado aqui, e não por um modelo de IA, de propósito: cada número e cada
 * nome sai de uma contagem do banco, sem chance de arredondar ou inventar.
 */
export function resumoDoDia(
  dados: DadosDoInicio,
  agora = new Date()
): TrechoDoResumo[] {
  const manha = saudacao(agora) === "Bom dia"
  const abertura = manha ? "Desde a meia-noite, " : "Hoje, "
  const { atendidos, consultasMarcadas } = dados.madrugada
  const trechos: TrechoDoResumo[] = []

  if (atendidos === 0) {
    trechos.push({
      texto: `${abertura}a assistente ainda não atendeu ninguém.`,
    })
  } else {
    trechos.push({ texto: `${abertura}a assistente atendeu ` })
    trechos.push({
      texto: plural(atendidos, "pessoa", "pessoas"),
      destaque: "forte",
    })
    if (consultasMarcadas > 0) {
      trechos.push({ texto: " e marcou " })
      trechos.push({
        texto: plural(consultasMarcadas, "consulta", "consultas"),
        destaque: "forte",
      })
    }
    trechos.push({ texto: "." })
  }

  const { total, itens } = dados.aguardando
  const maisAntiga: ConversaAguardando | undefined = itens[0]

  if (total === 0 || !maisAntiga) {
    trechos.push({ texto: " Nenhuma conversa espera por você." })
  } else if (total === 1) {
    trechos.push({ texto: " " })
    trechos.push({
      texto: `${maisAntiga.nome} espera sua resposta há ${espera(maisAntiga.desde, agora.getTime())}.`,
      destaque: "alerta",
    })
  } else {
    trechos.push({
      texto: ` ${total} conversas esperam por você, e `,
    })
    trechos.push({
      texto: `${maisAntiga.nome} espera há ${espera(maisAntiga.desde, agora.getTime())}.`,
      destaque: "alerta",
    })
  }

  return trechos
}

export function emReaisCompacto(valor: number): string {
  if (valor >= 1000) {
    const mil = (valor / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })
    return `R$ ${mil} mil`
  }
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })
}

/** Variação em %, ou null quando não há base de comparação. */
export function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Math.round(((atual - anterior) / anterior) * 100)
}

/** Caminho SVG de um minigráfico, normalizado na caixa dada. */
export function caminhoDaSerie(
  serie: number[],
  largura: number,
  altura: number
): string {
  if (serie.length === 0) return ""
  const max = Math.max(...serie, 1)
  const passo = serie.length > 1 ? largura / (serie.length - 1) : 0
  return serie
    .map((v, i) => {
      const x = Math.round(i * passo * 10) / 10
      const y = Math.round((altura - 2 - (v / max) * (altura - 4)) * 10) / 10
      return `${i === 0 ? "M" : "L"}${x} ${y}`
    })
    .join(" ")
}

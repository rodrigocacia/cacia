const MINUTO = 60 * 1000
const HORA = 60 * MINUTO

function inicioDoDia(data: Date): number {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime()
}

/**
 * Quanto tempo faz o último contato, curto, para caber numa coluna:
 * "agora", "há 12 min", "há 2 h", "ontem", "12/10" (ou "12/10/25" em outro
 * ano). Sem data, "—".
 */
export function ultimoContato(
  iso: string | null | undefined,
  agora: Date = new Date()
): string {
  if (!iso) return "—"

  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return "—"

  const diferenca = agora.getTime() - data.getTime()
  const mesmoDia = inicioDoDia(data) === inicioDoDia(agora)

  if (mesmoDia && diferenca < MINUTO) return "agora"
  if (mesmoDia && diferenca < HORA)
    return `há ${Math.floor(diferenca / MINUTO)} min`
  if (mesmoDia && diferenca >= 0) return `há ${Math.floor(diferenca / HORA)} h`

  const ontem = new Date(agora)
  ontem.setDate(ontem.getDate() - 1)
  if (inicioDoDia(data) === inicioDoDia(ontem)) return "ontem"

  const dia = String(data.getDate()).padStart(2, "0")
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  if (data.getFullYear() === agora.getFullYear()) return `${dia}/${mes}`

  return `${dia}/${mes}/${String(data.getFullYear()).slice(-2)}`
}

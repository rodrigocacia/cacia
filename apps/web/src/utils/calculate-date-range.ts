export function calculateDateRange(periodDays: string): {
  startDate: string
  endDate: string
} {
  const endDate = new Date()
  const startDate = new Date()

  // "Todos os períodos" é sem filtro de data. Havia aqui um fim fixo em
  // 31/01/2026: a partir de fevereiro, tudo o que entrou depois sumia do
  // painel, que mostrava zero leads e zero clientes.
  const days = parseInt(periodDays)

  if (periodDays === "-" || (periodDays !== ".1" && Number.isNaN(days))) {
    return { startDate: "", endDate: "" }
  }

  if (periodDays === ".1") {
    startDate.setHours(startDate.getHours() - 1)
  } else {
    startDate.setDate(startDate.getDate() - days)
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  }
}

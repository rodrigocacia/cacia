export function calculateDateRange(periodDays: string): {
  startDate: string
  endDate: string
} {
  const endDate = new Date()
  const startDate = new Date()

  if (periodDays === "-") {
    startDate.setFullYear(2024, 0, 1)
    endDate.setFullYear(2026, 0, 31)
  } else if (periodDays === ".1") {
    startDate.setHours(startDate.getHours() - 1)
  } else {
    const days = parseInt(periodDays)
    startDate.setDate(startDate.getDate() - days)
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  }
}

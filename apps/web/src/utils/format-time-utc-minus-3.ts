export function formatUtcMinus3(utcDateString: string): string {
  const date = new Date(utcDateString)

  const adjusted = new Date(date.getTime() - 3 * 60 * 60 * 1000)

  const hours = adjusted.getUTCHours().toString().padStart(2, "0")
  const minutes = adjusted.getUTCMinutes().toString().padStart(2, "0")

  return `${hours}:${minutes}`
}

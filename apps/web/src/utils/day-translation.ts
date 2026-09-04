export const translateWeekdayToLocale = (weekday: string): string => {
  const daysMap: Record<string, string> = {
    SUNDAY: "Domingo",
    MONDAY: "Segunda-feira",
    TUESDAY: "Terça-feira",
    WEDNESDAY: "Quarta-feira",
    THURSDAY: "Quinta-feira",
    FRIDAY: "Sexta-feira",
    SATURDAY: "Sábado",
  }

  return daysMap[weekday.toUpperCase()] ?? weekday
}

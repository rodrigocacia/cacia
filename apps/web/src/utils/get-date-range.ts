import {
  startOfToday,
  endOfTomorrow,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  format,
} from "date-fns"

export type DateRangeType = "today" | "day" | "week" | "month" | string

interface DateRange {
  start_time: string
  end_time: string
}

export function getDateRange(
  type: DateRangeType,
  referenceDate?: Date
): DateRange {
  const today = referenceDate || new Date()

  let start: Date
  let end: Date

  switch (type) {
    case "today":
      start = startOfToday()
      end = endOfTomorrow()
      break
    case "day":
      start = startOfDay(today)
      end = endOfDay(today)
      break
    case "week":
      start = startOfWeek(today, { weekStartsOn: 1 })
      end = endOfWeek(today, { weekStartsOn: 1 })
      break
    case "month":
      start = startOfMonth(today)
      end = endOfMonth(today)
      break
    default:
      start = startOfToday()
      end = endOfTomorrow()
      break
  }

  return {
    start_time: format(start, "yyyy-MM-dd"),
    end_time: format(end, "yyyy-MM-dd"),
  }
}

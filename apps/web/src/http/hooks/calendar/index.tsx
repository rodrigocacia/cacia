import useSWR from "swr"

import { getCalendar, GetCalendarResponse } from "@/http/calendar/get-calendar"
import { getCalendarById } from "@/http/calendar/get-calendar-by-id"
import { Calendar } from "@/types/calendar"

interface Params {
  page?: number
  search?: string
  limit?: number
}

export function useCalendar({ page = 1 }: Params) {
  const { data, error, isLoading, mutate } = useSWR<GetCalendarResponse>(
    ["calendar", page],
    () => getCalendar({ page })
  )

  return {
    calendar: data?.data ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useCalendarById(calendarId: string) {
  const { data, error, isLoading, mutate } = useSWR<Calendar>(
    calendarId ? ["calendar", calendarId] : null,
    () => getCalendarById(calendarId)
  )

  return {
    calendar: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  }
}

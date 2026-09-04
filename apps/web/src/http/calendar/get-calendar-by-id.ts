import { api } from "../api-client"

import { Calendar as GetCalendarByIdResponse } from "@/types/calendar"

export async function getCalendarById(calendarId: string) {
  const result = await api
    .get(`calendars/${calendarId}`)
    .json<GetCalendarByIdResponse>()

  return result
}

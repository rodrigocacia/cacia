import { formatUtcMinus3 } from "@/utils/format-time-utc-minus-3"
import { api } from "../api-client"

import { Event as GetEventByIdResponse } from "@/types/event"

export async function getEventById(eventId: string) {
  const result = await api.get(`event/${eventId}`).json<GetEventByIdResponse>()

  return {
    ...result,
    custom_start_time: formatUtcMinus3(result.start_time),
    custom_end_time: formatUtcMinus3(result.end_time),
  }
}

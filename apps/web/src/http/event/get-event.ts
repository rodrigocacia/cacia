"use server"

import { api } from "../api-client"
import { Event } from "@/types/event"
import { formatUtcMinus3 } from "@/utils/format-time-utc-minus-3"

export interface GetEventResponse {
  data: Event[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
  calendar_id: string
  start_time?: string
  end_time?: string
  process_id?: string
  customer_id?: string
}

export async function getEvent({
  page,
  calendar_id,
  start_time,
  end_time,
  process_id,
  customer_id,
}: QueryParams) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    calendar_id,
  })

  if (calendar_id === "all") {
    queryParams.delete("calendar_id")
  }

  if (start_time && end_time) {
    queryParams.set("start_time", start_time)
    queryParams.set("end_time", end_time)
  }

  if (process_id) {
    queryParams.set("process_id", process_id)
  }

  if (customer_id) {
    queryParams.set("customer_id", customer_id)
  }

  queryParams.set("limit", "100")

  const result = await api
    .get(`events?${queryParams.toString()}`, {
      next: { tags: [`event/${calendar_id}`] },
    })
    .json<GetEventResponse>()

  const data: Event[] = result.data.map((ev) => {
    const startMs = new Date(ev.start_time).getTime() - 3 * 60 * 60 * 1000
    const endMs = new Date(ev.end_time).getTime() - 3 * 60 * 60 * 1000

    return {
      ...ev,
      start_time: new Date(startMs).toISOString(),
      end_time: new Date(endMs).toISOString(),
      custom_start_time: formatUtcMinus3(ev.start_time),
      custom_end_time: formatUtcMinus3(ev.end_time),
    }
  })

  return { ...result, data }
}

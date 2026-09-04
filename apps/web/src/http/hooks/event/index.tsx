import useSWR from "swr"

import { getEventById } from "@/http/event/get-event-by-id"
import { Event } from "@/types/event"

export function useEventById(eventId: string) {
  const { data, error, isLoading, mutate } = useSWR<Event>(
    ["event", eventId],
    () => getEventById(eventId)
  )

  return {
    event: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  }
}

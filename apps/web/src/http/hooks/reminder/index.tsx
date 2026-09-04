import useSWR from "swr"

import { getReminder } from "@/http/reminder/get-reminder"
import { Reminder } from "@/types/reminder"

interface GetReminderResponse {
  success: boolean
  data?: Reminder[]
  error?: unknown
}

export function useReminder(eventId: string) {
  const { data, error, isLoading, mutate } = useSWR<GetReminderResponse>(
    eventId ? ["reminder", eventId] : null,
    () => getReminder(eventId),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    reminders: data?.success ? data.data : [],
    isLoading,
    isError: !!error || (data && !data.success),
    mutate,
  }
}

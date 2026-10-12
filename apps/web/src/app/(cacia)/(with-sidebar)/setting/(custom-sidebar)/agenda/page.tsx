import { SWRConfig } from "swr"

import { getCalendar } from "@/http/calendar/get-calendar"

import { AgendaDetail } from "./detail"

export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams

  const calendar = await getCalendar({ page: Number(page ?? 1) })

  return (
    <SWRConfig
      value={{
        fallback: {
          calendar: calendar,
        },
        revalidateOnFocus: false,
        revalidateIfStale: true,
        revalidateOnReconnect: false,
        refreshInterval: 0,
      }}
    >
      <AgendaDetail />
    </SWRConfig>
  )
}

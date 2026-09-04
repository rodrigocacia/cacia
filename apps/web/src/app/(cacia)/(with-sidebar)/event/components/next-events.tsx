import { redirect } from "next/navigation"

import { getEvent } from "@/http/event/get-event"
import { getCalendar } from "@/http/calendar/get-calendar"
import { GetEventResponse } from "@/http/event/get-event"

import CardEvent from "./card-event"
import { getDateRange } from "@/utils/get-date-range"
import { addHours } from "@/utils/add-hours"

export async function NextEvents({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string }>
}) {
  const { calendar } = await searchParams

  const calendars = await getCalendar({ page: 1 })

  let events: GetEventResponse | null = null

  if (!calendar && calendars.data.length > 0) {
    redirect(`?calendar=${calendars.data[0]._id}`)
  }

  if (calendars.data.length > 0) {
    events = await getEvent({
      page: 1,
      calendar_id: String(calendar),
      start_time: getDateRange("month").start_time,
      end_time: getDateRange("month").end_time,
    })
  }

  const now = new Date()

  const futureEvents = (events?.data ?? [])
    .filter((ev) => {
      const start = addHours(new Date(ev.start_time), 3)
      return start > now
    })
    .sort(
      (a, b) =>
        addHours(new Date(a.start_time), 3).getTime() -
        addHours(new Date(b.start_time), 3).getTime()
    )

  return (
    <div className="w-full flex flex-col">
      <h2 className="text-[18px] text-[#3D3D3D] max-lg:hidden">
        <b>Próximos</b> eventos
      </h2>

      <div className="w-full flex flex-col max-h-[calc(100vh-690px)] overflow-y-scroll gap-1.5 mt-3.5 max-lg:hidden">
        {futureEvents.map((event) => (
          <CardEvent
            key={event?._id}
            id={event?._id}
            variant={event?.type}
            start_time={event?.start_time}
            end_time={event?.end_time}
            title={event?.title}
            lead={event?.lead}
            customer={event?.customer}
            process={event?.process}
          />
        ))}
      </div>
    </div>
  )
}

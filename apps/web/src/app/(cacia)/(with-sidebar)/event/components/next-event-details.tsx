import { redirect } from "next/navigation"

import { getEvent } from "@/http/event/get-event"
import { getCalendar } from "@/http/calendar/get-calendar"
import { GetEventResponse } from "@/http/event/get-event"

import CardEvent from "@/app/(cacia)/(with-sidebar)/event/components/card-event"
import { getDateRange } from "@/utils/get-date-range"
import { Icon } from "@/components/icone"
import { EmptySearch } from "@/components/empty-search"
import { addHours } from "@/utils/add-hours"
import { DialogShowEvent } from "./calendar/dialog-show-event"

type ContextType = "process" | "customer"

export async function NextEventDetails({
  searchParams,
  processId,
  customerId,
  context,
}: {
  searchParams: Promise<{ calendar?: string }>
  processId?: string
  customerId?: string
  context: ContextType
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
      calendar_id: "all",
      start_time: getDateRange("month").start_time,
      end_time: getDateRange("month").end_time,
      process_id: processId,
      customer_id: customerId,
    })
  }

  const getTitle = () => {
    switch (context) {
      case "process":
        return "Próximos eventos do processo"
      case "customer":
        return "Próximos eventos do cliente"
      default:
        return "Próximos eventos"
    }
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
      <div className="w-full flex items-center gap-1.5 max-md:mt-5 max-md:mb-2">
        <Icon
          icon="mdi:calendar-month-outline"
          className="text-[#BDBDBD] w-5 h-5"
        />

        <h2 className="text-sm text-[#3D3D3D] font-bold ">
          {getTitle()} ({futureEvents?.length || 0})
        </h2>
      </div>

      {futureEvents?.length === 0 && (
        <EmptySearch
          title="Nenhum evento encontrado"
          subtitle="Não há eventos programados para este período"
        />
      )}

      {futureEvents?.length > 0 && (
        <div className="w-full grid grid-cols-2 max-[1140px]:grid-cols-1 xl:grid-cols-3 gap-3 mt-3.5">
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
              hasFromAnotherPlace
            />
          ))}
        </div>
      )}

      <DialogShowEvent />
    </div>
  )
}

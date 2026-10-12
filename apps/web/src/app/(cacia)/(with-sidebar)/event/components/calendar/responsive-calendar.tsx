import { redirect } from "next/navigation"
import { CalendarMonth } from "../calendar-month"

import CardNextEvent from "../card-next-event"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getCalendar } from "@/http/calendar/get-calendar"
import { getEvent, GetEventResponse } from "@/http/event/get-event"
import { Event } from "@/types/event"
import { getDateRange } from "@/utils/get-date-range"
import { addHours } from "@/utils/add-hours"

export async function ResponsiveCalendar({
  searchParams,
  dataEvents,
}: {
  searchParams: Promise<{
    day?: string
    calendar?: string
    selectedDate?: string
    tab?: string
  }>
  dataEvents: Event[]
}) {
  const { day, calendar, selectedDate } = await searchParams

  const calendars = await getCalendar({ page: 1 })

  let events: GetEventResponse | null = null

  if (!calendar && calendars.data.length > 0) {
    redirect(`?calendar=${calendars.data[0]._id}`)
  }

  let referenceDate: Date | undefined = undefined
  let dateParam: string | undefined = undefined

  if (selectedDate) {
    const [year, month, dayNum] = selectedDate.split("-").map(Number)
    referenceDate = new Date(year, month - 1, dayNum)
    dateParam = selectedDate
  } else if (day) {
    const [year, month, dayNum] = day.split("-").map(Number)
    referenceDate = new Date(year, month - 1, dayNum)
    dateParam = day
  }

  if (calendars.data.length > 0) {
    events = await getEvent({
      page: 1,
      calendar_id: String(calendar),
      start_time: dateParam || getDateRange("week").start_time,
      end_time: dateParam || getDateRange("week").end_time,
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

  const formattedDay = referenceDate
    ? format(referenceDate, "dd 'de' MMMM", { locale: ptBR })
    : format(new Date(), "dd 'de' MMMM", { locale: ptBR })

  return (
    <div className="flex h-fit flex-col gap-4 px-4 md:hidden">
      <div className="rounded-[14px] border border-filete bg-white p-4">
        <CalendarMonth events={dataEvents || []} />
      </div>

      <section className="flex flex-col overflow-hidden rounded-[14px] border border-filete bg-white">
        <div className="flex items-baseline justify-between gap-2 border-b border-filete px-4 py-3.5">
          <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-tinta">
            Próximos eventos
          </h2>
          <span className="tabular text-xs text-tinta-3">{formattedDay}</span>
        </div>

        {futureEvents.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-tinta-3">
            Nenhum evento para o dia selecionado.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 p-3">
            {futureEvents.slice(0, 5).map((event) => (
              <CardNextEvent
                key={event?._id}
                eventId={event?._id}
                variant={event?.type}
                start_time={event?.start_time}
                custom_start_time={event?.custom_start_time}
                custom_end_time={event?.custom_end_time}
                title={event?.title}
                description={event?.description}
                lead={event?.lead}
                customer={event?.customer}
                status={event?.status}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

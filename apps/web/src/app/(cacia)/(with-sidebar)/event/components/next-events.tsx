import { redirect } from "next/navigation"

import { getEvent } from "@/http/event/get-event"
import { getCalendar } from "@/http/calendar/get-calendar"
import { GetEventResponse } from "@/http/event/get-event"

import CardEvent from "./card-event"
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

  const now = new Date()

  // De agora até 30 dias à frente, e não o mês corrente: no fim do mês a lista
  // ficava vazia com compromissos marcados para a semana seguinte.
  const daquiA30Dias = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  if (calendars.data.length > 0) {
    events = await getEvent({
      page: 1,
      calendar_id: String(calendar),
      start_time: now.toISOString(),
      end_time: daquiA30Dias.toISOString(),
    })
  }

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
    <div className="flex w-full flex-col max-lg:hidden">
      <div className="flex items-center gap-2.5 border-b border-filete px-5 py-4">
        <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-tinta">
          Próximos eventos
        </h2>
        <span className="font-mono text-[11px] text-tinta-3 tabular">
          {futureEvents.length}
        </span>
      </div>

      {futureEvents.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] text-tinta-3">
          Nada marcado para os próximos 30 dias.
        </p>
      ) : (
        <div className="flex max-h-[calc(100vh-640px)] min-h-[160px] w-full flex-col gap-1.5 overflow-y-auto p-3">
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
      )}
    </div>
  )
}

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

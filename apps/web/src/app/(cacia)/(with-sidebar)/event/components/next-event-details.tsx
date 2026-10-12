import { ReactNode } from "react"
import { redirect } from "next/navigation"

import { getEvent } from "@/http/event/get-event"
import { getCalendar } from "@/http/calendar/get-calendar"
import { GetEventResponse } from "@/http/event/get-event"

import CardEvent from "@/app/(cacia)/(with-sidebar)/event/components/card-event"
import { getDateRange } from "@/utils/get-date-range"
import { Painel } from "@/components/tables/ficha"
import { addHours } from "@/utils/add-hours"
import { DialogShowEvent } from "./calendar/dialog-show-event"

type ContextType = "process" | "customer"

export async function NextEventDetails({
  searchParams,
  processId,
  customerId,
  context,
  acao,
}: {
  searchParams: Promise<{ calendar?: string }>
  processId?: string
  customerId?: string
  context: ContextType
  /** Botão no cabeçalho do painel (em geral, "Novo evento"). */
  acao?: ReactNode
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
    <>
      <Painel
        titulo={getTitle()}
        contagem={futureEvents?.length || 0}
        acao={acao}
      >
        {futureEvents?.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-tinta-3">
            Nenhum evento programado para este mês.
          </p>
        ) : (
          <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
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
      </Painel>

      <DialogShowEvent />
    </>
  )
}

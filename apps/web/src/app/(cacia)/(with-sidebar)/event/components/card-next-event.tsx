"use client"

import clsx from "clsx"
import { format } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { EventStatus, EventType } from "@/types/event"
import { ptBR } from "date-fns/locale"

import { corDoEvento, ehPrazo, ROTULO_DO_TIPO } from "./estilo-do-evento"

type CardNextEventProps = {
  eventId: string
  variant: EventType
  start_time: string
  custom_start_time: string
  custom_end_time: string
  title: string
  status: EventStatus
  description?: string
  lead?: {
    _id: string
    name: string
  }
  customer?: {
    _id: string
    name: string
  }
}

export default function CardNextEvent({
  eventId,
  variant = EventType.HEARING,
  start_time,
  custom_start_time,
  custom_end_time,
  title,
  status,
  description,
  lead,
  customer,
}: CardNextEventProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const formattedDate = format(start_time, "dd")
  const dayBrev = format(start_time, "EEE", { locale: ptBR }).replace(".", "")

  const cor = corDoEvento(variant)

  function handleEditEvent() {
    const params = new URLSearchParams(searchParams)
    params.set("editEventId", eventId)
    router.push(`?${params.toString()}`)
  }

  const vinculos = [
    lead ? `Lead ${lead.name}` : null,
    customer ? customer.name : null,
  ].filter(Boolean)

  return (
    <button
      type="button"
      onClick={handleEditEvent}
      className={clsx(
        "flex w-full cursor-pointer items-start gap-3 rounded-[10px] border border-l-2 border-filete bg-white p-3 text-left transition-colors hover:bg-papel",
        cor.filete,
        status === EventStatus.CANCEL && "opacity-60"
      )}
    >
      <div className="flex w-9 shrink-0 flex-col items-center">
        <span className="tabular text-[17px] leading-none font-semibold text-tinta">
          {formattedDate}
        </span>
        <span className="rotulo mt-1">{dayBrev}</span>
      </div>

      <div className="flex min-w-0 flex-grow flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="tabular text-xs text-tinta-3">
            {custom_start_time}–{custom_end_time}
          </span>
          <span
            className={clsx(
              "shrink-0 text-[11px] font-semibold",
              ehPrazo(variant) ? "text-ambar" : "text-tinta-3"
            )}
          >
            {ROTULO_DO_TIPO[variant] ?? variant}
          </span>
        </div>

        <h3 className="truncate text-[13.5px] font-medium text-tinta">
          {title}
        </h3>

        {vinculos.length > 0 && (
          <p className="truncate text-xs text-tinta-3">
            {vinculos.join(" · ")}
          </p>
        )}

        {description && (
          <p className="line-clamp-2 text-xs text-tinta-3">{description}</p>
        )}
      </div>
    </button>
  )
}

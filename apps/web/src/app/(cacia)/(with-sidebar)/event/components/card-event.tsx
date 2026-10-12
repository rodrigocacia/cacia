"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { format } from "date-fns"

import clsx from "clsx"

import { ptBR } from "date-fns/locale"

import { EventType } from "@/types/event"
import { formatTime, formatProcess } from "@/utils/formatters"

import { corDoEvento, ehPrazo, ROTULO_DO_TIPO } from "./estilo-do-evento"

type CardEventProps = {
  id: string
  variant: EventType
  start_time: string
  end_time: string
  title: string
  hasFromAnotherPlace?: boolean
  lead?: {
    _id: string
    name: string
  }
  customer?: {
    _id: string
    name: string
  }
  process?: {
    _id: string
    number: string
  }
}

export default function CardEvent({
  id,
  variant = EventType.HEARING,
  start_time,
  end_time,
  title,
  lead,
  customer,
  process,
  hasFromAnotherPlace = false,
}: CardEventProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const eventId = searchParams.get("eventId")

  const formattedStartHour = formatTime(start_time)
  const formattedEndHour = formatTime(end_time)

  const formattedStartDate = format(start_time, "EEE, dd MMM", {
    locale: ptBR,
  }).replace(".", "")

  const cor = corDoEvento(variant)

  const vinculos = [
    lead ? `Lead ${lead.name}` : null,
    customer ? customer.name : null,
    process ? `Processo ${formatProcess(process.number)}` : null,
  ].filter(Boolean)

  function handleSelectEvent() {
    if (hasFromAnotherPlace) {
      const params = new URLSearchParams(searchParams)
      params.set("eventShowId", id)
      router.replace(`${pathname}?${params.toString()}`)

      return
    }

    if (eventId === id) {
      const params = new URLSearchParams(searchParams)
      params.delete("eventId")
      router.replace(`?${params.toString()}`)
    }

    const params = new URLSearchParams(searchParams)
    params.set("eventId", id)
    router.replace(`?${params.toString()}`)
  }

  return (
    <button
      type="button"
      className={clsx(
        "flex w-full cursor-pointer flex-col gap-1 rounded-[10px] border border-l-2 border-filete bg-white px-3 py-2.5 text-left transition-colors hover:bg-papel",
        cor.filete,
        eventId === id && "bg-papel ring-1 ring-filete-forte"
      )}
      onClick={handleSelectEvent}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="tabular truncate text-xs text-tinta-3 first-letter:uppercase">
          {formattedStartDate} · {formattedStartHour}–{formattedEndHour}
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

      <h3 className="w-full truncate text-[13.5px] font-medium text-tinta">
        {title}
      </h3>

      {vinculos.length > 0 && (
        <p className="tabular w-full truncate text-xs text-tinta-3">
          {vinculos.join(" · ")}
        </p>
      )}
    </button>
  )
}

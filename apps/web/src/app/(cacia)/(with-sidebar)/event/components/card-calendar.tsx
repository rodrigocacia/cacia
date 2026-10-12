import { EventStatus, EventType } from "@/types/event"
import clsx from "clsx"

import { corDoEvento } from "./estilo-do-evento"

interface CardCalendarProps {
  title: string
  start_hour: string
  end_hour: string
  status?: EventStatus
  variant?: EventType
}

/** Chip de evento dentro das grades de dia, semana e mês. */
export default function CardCalendar({
  title,
  start_hour,
  end_hour,
  status = EventStatus.PENDING,
  variant = EventType.HEARING,
}: CardCalendarProps) {
  const cor = corDoEvento(variant)
  const cancelado = status === EventStatus.CANCEL

  return (
    <div
      className={clsx(
        "flex h-full cursor-pointer flex-col gap-px overflow-hidden rounded-[6px] border-l-2 px-1.5 py-1 transition-[filter] hover:brightness-[0.97]",
        cor.chip,
        cancelado && "opacity-60"
      )}
      title={title}
    >
      <strong
        className={clsx(
          "truncate text-[11.5px] leading-tight font-semibold",
          cor.texto,
          cancelado && "line-through"
        )}
      >
        {title}
      </strong>

      <span className="tabular truncate text-[11px] leading-tight text-tinta-2">
        {start_hour}–{end_hour}
      </span>
    </div>
  )
}

import { EventType } from "@/types/event"
import clsx from "clsx"

import { corDoEvento, ROTULO_DO_TIPO } from "../estilo-do-evento"

export function TypeEvent({ type }: { type: EventType }) {
  return (
    <span className="inline-flex h-[22px] w-fit items-center gap-1.5 rounded-md border border-[#E3DED6] bg-white px-2 text-xs whitespace-nowrap text-tinta-2">
      <span
        className={clsx("h-1.5 w-1.5 rounded-full", corDoEvento(type).ponto)}
      />
      {ROTULO_DO_TIPO[type] ?? type}
    </span>
  )
}

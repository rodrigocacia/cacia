import { EventStatus } from "@/types/event"
import clsx from "clsx"

const STATUS: Record<EventStatus, { rotulo: string; ponto: string }> = {
  [EventStatus.PENDING]: { rotulo: "Pendente", ponto: "bg-ambar-ponto" },
  [EventStatus.CONFIRM]: { rotulo: "Confirmado", ponto: "bg-acao" },
  [EventStatus.CANCEL]: { rotulo: "Cancelado", ponto: "bg-[#C2513E]" },
  [EventStatus.DONE]: { rotulo: "Concluído", ponto: "bg-turquesa-profundo" },
}

export function StatusEvent({ status }: { status: EventStatus }) {
  const item = STATUS[status]

  return (
    <span className="inline-flex h-[22px] w-fit items-center gap-1.5 rounded-md border border-[#E3DED6] bg-white px-2 text-xs whitespace-nowrap text-tinta-2">
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          item?.ponto ?? "bg-gray-400"
        )}
      />
      {item?.rotulo ?? status}
    </span>
  )
}

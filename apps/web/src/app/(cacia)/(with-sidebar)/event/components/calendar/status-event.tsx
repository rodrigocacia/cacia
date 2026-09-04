import { EventStatus } from "@/types/event"
import clsx from "clsx"

const labelVariant = [
  {
    variant: EventStatus.PENDING,
    label: "Pendente",
  },
  {
    variant: EventStatus.CONFIRM,
    label: "Confirmado",
  },
  {
    variant: EventStatus.CANCEL,
    label: "Cancelado",
  },
  {
    variant: EventStatus.DONE,
    label: "Concluído",
  },
]

export function StatusEvent({ status }: { status: EventStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-medium text-sm px-2 py-1 rounded-full",
        {
          "bg-[#FFE4B6] text-[#F59E0B]": status === EventStatus.PENDING,
          "bg-[#DBEAFE] text-[#3B82F6]": status === EventStatus.CONFIRM,
          "bg-[#FFCFCF] text-[#EF4444]": status === EventStatus.CANCEL,
          "bg-[#DDFFFB] text-[#34C791]": status === EventStatus.DONE,
        }
      )}
    >
      <span
        className={clsx("w-2 h-2 rounded-full", {
          "bg-[#F59E0B]": status === EventStatus.PENDING,
          "bg-[#3B82F6]": status === EventStatus.CONFIRM,
          "bg-[#EF4444]": status === EventStatus.CANCEL,
          "bg-[#34C791]": status === EventStatus.DONE,
        })}
      />
      {labelVariant.find((label) => label.variant === status)?.label}
    </span>
  )
}

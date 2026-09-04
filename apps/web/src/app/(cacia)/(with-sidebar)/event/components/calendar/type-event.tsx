import { EventType } from "@/types/event"
import clsx from "clsx"

const labelVariant = [
  {
    variant: EventType.COMMITMENT,
    label: "Compromisso",
  },
  {
    variant: EventType.HEARING,
    label: "Audiência",
  },
  {
    variant: EventType.DEADLINE,
    label: "Prazo",
  },
  {
    variant: EventType.INQUIRY,
    label: "Inquérito",
  },
  {
    variant: EventType.MEETING,
    label: "Reunião",
  },
  {
    variant: EventType.SERVICE,
    label: "Atendimento",
  },
].sort((a, b) => a.label.localeCompare(b.label))

export function TypeEvent({ type }: { type: EventType }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-medium text-sm px-2 py-1 rounded-full",
        {
          "bg-[#F3E8FF] text-[#008a83]": type === EventType.COMMITMENT,
          "bg-[#EBDAFB] text-[#9333EA]": type === EventType.HEARING,
          "bg-[#DBFADC] text-[#16A31B]": type === EventType.DEADLINE,
          "bg-[#FDECD8] text-[#EA820C]": type === EventType.INQUIRY,
          "bg-[#DBEAFE] text-[#2563EB]": type === EventType.MEETING,
          "bg-[#E6F4FF] text-[#1E40AF]": type === EventType.SERVICE,
        }
      )}
    >
      <span
        className={clsx("w-2 h-2 rounded-full", {
          "bg-[#008a83]": type === EventType.COMMITMENT,
          "bg-[#9333EA]": type === EventType.HEARING,
          "bg-[#16A31B]": type === EventType.DEADLINE,
          "bg-[#EA820C]": type === EventType.INQUIRY,
          "bg-[#2563EB]": type === EventType.MEETING,
          "bg-[#1E40AF]": type === EventType.SERVICE,
        })}
      />
      {labelVariant.find((label) => label.variant === type)?.label}
    </span>
  )
}

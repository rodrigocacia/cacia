"use client"

import clsx from "clsx"
import { format } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { EventStatus, EventType } from "@/types/event"
import { Icon } from "@/components/icone"
import { Clock } from "lucide-react"
import { formatName } from "@/utils/formatters"

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
  const formattedDay = format(start_time, "EEEE")

  const dayBrev = formattedDay.slice(0, 3).toUpperCase()

  const labelVariant = [
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
    {
      variant: EventType.COMMITMENT,
      label: "Compromisso",
    },
  ].sort((a, b) => a.label.localeCompare(b.label))

  function handleEditEvent() {
    const params = new URLSearchParams(searchParams)
    params.set("editEventId", eventId)
    router.push(`?${params.toString()}`)
  }

  return (
    <div
      onClick={handleEditEvent}
      className={clsx(
        "flex justify-between p-3 rounded-2xl shadow-sm bg-white",
        "border-l-4",
        {
          "border-[#F59E0B]": status === EventStatus.PENDING,
          "border-[#3B82F6]": status === EventStatus.CONFIRM,
          "border-[#EF4444]": status === EventStatus.CANCEL,
          "border-[#14B8A6]": status === EventStatus.DONE,
        }
      )}
    >
      <div className="flex gap-2">
        <div className="flex flex-col items-center gap-2 pr-3">
          <h3 className="text-sm text-[#707070] font-bold">{formattedDate}</h3>

          <p className="text-sm text-[#707070]">{dayBrev}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-[#707070]">
            {title.length > 25 ? `${title.slice(0, 25)}...` : title}
          </h3>

          <div className="flex items-center gap-1 text-gray-400 text-[10px]">
            <Clock className="w-4 h-4" />
            {custom_start_time} - {custom_end_time}
          </div>

          {lead && (
            <div className="flex items-center gap-2 text-gray-500 text-[10px]">
              <Icon
                icon="mdi:folder-text-outline"
                className="w-3 h-3 text-[#BDBDBD]"
              />
              LEAD: {formatName(lead.name)}
            </div>
          )}

          {customer && (
            <div className="flex items-center gap-2 text-gray-500 text-[10px]">
              <Icon
                icon="mdi:account-outline"
                className="w-3 h-3 text-[#BDBDBD]"
              />
              CLIENTE: {formatName(customer.name)}
            </div>
          )}

          {description && (
            <>
              <div className="text-gray-500 text-[10px] mt-1">
                {description.length > 65
                  ? `${description.substring(0, 65)}...`
                  : description}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span
          className={clsx(
            "h-fit text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
            {
              "bg-[#EBDAFB] text-[#9333EA]": variant === EventType.HEARING,
              "bg-[#DBFADC] text-[#16A31B]": variant === EventType.DEADLINE,
              "bg-[#FDECD8] text-[#EA820C]": variant === EventType.INQUIRY,
              "bg-[#DBEAFE] text-[#2563EB]": variant === EventType.MEETING,
              "bg-[#E6F4FF] text-[#1E40AF]": variant === EventType.SERVICE,
              "bg-[#F3E8FF] text-[#008a83]": variant === EventType.COMMITMENT,
            }
          )}
        >
          {labelVariant.find((item) => item.variant === variant)?.label}
        </span>
      </div>
    </div>
  )
}

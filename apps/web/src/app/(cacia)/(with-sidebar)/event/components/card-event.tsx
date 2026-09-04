"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { format } from "date-fns"

import clsx from "clsx"

import { CalendarCheck, Clock, UserIcon, FileIcon } from "lucide-react"

import { EventType } from "@/types/event"
import { formatTime, formatName, formatProcess } from "@/utils/formatters"

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

  const formattedStartDate = format(start_time, "dd/MM/yyyy")

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
    <div
      className={clsx(
        "cursor-pointer flex flex-col gap-2 p-3 rounded-2xl shadow-sm relative bg-white w-full",
        "border-l-4",
        {
          "border-[#9333EA]": variant === EventType.HEARING,
          "border-[#16A31B]": variant === EventType.DEADLINE,
          "border-[#EA820C]": variant === EventType.INQUIRY,
          "border-[#2563EB]": variant === EventType.MEETING,
          "border-[#1E40AF]": variant === EventType.SERVICE,
          "border-[#158f89]": variant === EventType.COMMITMENT,
        }
      )}
      onClick={handleSelectEvent}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-gray-400 text-[10px]">
            <CalendarCheck className="w-4 h-4" />
            {formattedStartDate}
          </div>

          <div className="flex items-center gap-1 text-gray-400 text-[10px]">
            <Clock className="w-4 h-4" />
            <b>{formattedStartHour}</b> - <b>{formattedEndHour}</b>
          </div>
        </div>

        <span
          className={clsx(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
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

      {lead && (
        <div className="flex items-center gap-2 text-gray-500 text-[10px]">
          <UserIcon className="w-4 h-4" />
          LEAD: <b>{lead.name}</b>
        </div>
      )}

      {customer && (
        <div className="flex items-center gap-2 text-gray-500 text-[10px]">
          <UserIcon className="w-4 h-4" />
          CLIENTE: <b>{formatName(customer.name)}</b>
        </div>
      )}

      {process && (
        <div className="flex items-center gap-2 text-gray-500 text-[10px]">
          <FileIcon className="w-4 h-4" />
          PROCESSO: <b>{formatProcess(process.number)}</b>
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-700">
        {title.length > 25 ? `${title.slice(0, 25)}...` : title}
      </h3>
    </div>
  )
}

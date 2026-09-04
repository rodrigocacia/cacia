import { EventStatus, EventType } from "@/types/event"
import clsx from "clsx"

interface CardCalendarProps {
  title: string
  start_hour: string
  end_hour: string
  status?: EventStatus
  variant?: EventType
}

export default function CardCalendar({
  title,
  start_hour,
  end_hour,
  status = EventStatus.PENDING,
  variant = EventType.HEARING,
}: CardCalendarProps) {
  return (
    <div
      className={clsx(
        "cursor-pointer flex flex-col gap-[2px] rounded-[6px] p-1 border-l-2 border-solid",
        {
          "border-[#F59E0B]": status === EventStatus.PENDING,
          "border-[#3B82F6]": status === EventStatus.CONFIRM,
          "border-[#EF4444]": status === EventStatus.CANCEL,
          "border-[#14B8A6]": status === EventStatus.DONE,
          "bg-[#EBDAFB]": variant === EventType.HEARING,
          "bg-[#EDFDEE]": variant === EventType.DEADLINE,
          "bg-[#FDECD8]": variant === EventType.INQUIRY,
          "bg-[#DBEAFE]": variant === EventType.MEETING,
          "bg-[#E6F4FF]": variant === EventType.SERVICE,
          "bg-[#158f89]": variant === EventType.COMMITMENT,
        }
      )}
    >
      <strong
        className={clsx(
          "text-[10px]",
          variant === EventType.HEARING && "text-[#9333EA]",
          variant === EventType.DEADLINE && "text-[#16A31B]",
          variant === EventType.INQUIRY && "text-[#EA820C]",
          variant === EventType.MEETING && "text-[#2563EB]",
          variant === EventType.SERVICE && "text-[#1E40AF]",
          variant === EventType.COMMITMENT && "text-[#a5f8f4]"
        )}
      >
        {title.length > 15 ? `${title.slice(0, 15)}...` : title}
      </strong>

      <span
        className={clsx(
          "text-[10px]",
          variant === EventType.HEARING && "text-[#9333EA]",
          variant === EventType.DEADLINE && "text-[#16A31B]",
          variant === EventType.INQUIRY && "text-[#EA820C]",
          variant === EventType.MEETING && "text-[#2563EB]",
          variant === EventType.SERVICE && "text-[#1E40AF]",
          variant === EventType.COMMITMENT && "text-[#a5f8f4]"
        )}
      >
        {start_hour} - {end_hour}
      </span>
    </div>
  )
}

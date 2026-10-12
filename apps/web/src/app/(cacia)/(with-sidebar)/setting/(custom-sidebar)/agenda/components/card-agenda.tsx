import Link from "next/link"
import { CalendarCheck, ChevronRight } from "lucide-react"

import { Calendar } from "@/types/calendar"

interface CardAgendaProps {
  agenda: Calendar
}

/** Uma agenda na lista: linha inteira clicável, separada por filete. */
export function CardAgenda({ agenda }: CardAgendaProps) {
  return (
    <li className="border-t border-[#F1EEE8] first:border-t-0">
      <Link
        href={`/setting/agenda/${agenda?._id}/edit`}
        className="group flex items-center gap-3 px-7 py-3.5 transition-colors hover:bg-[#FBFAF7] max-md:px-5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-nevoa text-turquesa-profundo">
          <CalendarCheck size={17} strokeWidth={1.7} aria-hidden />
        </span>

        <span className="min-w-0 flex-grow truncate text-[14px] font-medium text-tinta">
          {agenda?.title}
        </span>

        <ChevronRight
          size={16}
          strokeWidth={1.7}
          className="shrink-0 text-tinta-3 transition-colors group-hover:text-tinta"
          aria-hidden
        />
      </Link>
    </li>
  )
}

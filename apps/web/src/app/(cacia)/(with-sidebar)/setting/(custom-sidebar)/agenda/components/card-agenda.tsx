import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"
import { BiCalendarCheck } from "react-icons/bi"
import { Calendar } from "@/types/calendar"
import Link from "next/link"
import { Icon } from "@iconify/react/dist/iconify.js"

interface CardAgendaProps {
  agenda: Calendar
}

export function CardAgenda({ agenda }: CardAgendaProps) {
  return (
    <div className="bg-white px-2 py-3 flex items-center justify-between gap-2.5 border border-[#F6F6F9] rounded-[12px]">
      <Link
        href={`/setting/agenda/${agenda?._id}/edit`}
        className="w-full flex items-center gap-2.5"
      >
        <div className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-[#ECF7F8]">
          <BiCalendarCheck className="w-6 h-6 text-[#348C98]" />
        </div>

        <h3 className=" text-sm text-[#707070] font-semibold">
          {agenda?.title}
        </h3>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <Link href={`/setting/agenda/${agenda?._id}/edit`}>
            <DropdownMenuItem onClick={() => {}}>
              <div className="flex items-center gap-2">
                <Icon icon="mdi:eye" className="text-[#348C98] w-5 h-5" />

                <p className="text-base text-[#3D3D3D]">Ver</p>
              </div>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

"use client"

import { EmptySearch } from "@/components/empty-search"
import { Icon } from "@iconify/react/dist/iconify.js"
import { CardAgenda } from "./components/card-agenda"
import { Button } from "@/components/ui/custom-button"
import Link from "next/link"
import { useCalendar } from "@/http/hooks/calendar"
import { useSearchParams } from "next/navigation"
import { Spinner } from "@/components/ui/sppiner"

export function AgendaDetail() {
  const params = useSearchParams()

  const page = params.get("page")

  const { calendar, isLoading } = useCalendar({ page: Number(page ?? 1) })

  if (isLoading) {
    return (
      <div className="p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm">
      <div className="flex items-center gap-3 max-md:mt-4">
        <Icon icon="mdi:calendar-check" className="w-8 h-8 text-[#BDBDBD]" />

        <h3 className="text-[20px] text-[#707070] font-bold">Agendas</h3>
      </div>

      <hr className="w-full my-4 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <div className="w-full flex items-center gap-1 mt-[22px]">
        <Icon icon="mdi:calendar-check" className="text-[#BDBDBD] w-5 h-5" />

        <h2 className="text-sm text-[#3D3D3D] font-bold">
          Todos as agendas ({calendar?.length})
        </h2>
      </div>

      <div className="h-full w-full mt-4 flex flex-col justify-between gap-8">
        <div className="w-full flex flex-col gap-4">
          {calendar.length === 0 ? (
            <EmptySearch title="Sem agendas cadastradass" subtitle="" />
          ) : null}

          {calendar.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
              {calendar.map((agenda) => (
                <CardAgenda key={agenda._id} agenda={agenda} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="w-full flex-1 flex items-center justify-end max-md:justify-end max-md:items-end">
          <Link href="/setting/agenda/new">
            <Button
              className="cursor-pointer max-md:rounded-full max-md:flex max-md:justify-center max-md:items-center"
              iconLeft={
                <Icon
                  icon="mdi:plus"
                  className="cursor-pointer max-md:hidden"
                />
              }
            >
              <span className="max-md:hidden">Nova agenda</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

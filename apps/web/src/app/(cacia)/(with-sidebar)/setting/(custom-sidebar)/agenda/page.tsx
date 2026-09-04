import { SWRConfig } from "swr"

import { BiCalendarCheck } from "react-icons/bi"

import { getCalendar } from "@/http/calendar/get-calendar"

import { CustomTab } from "@/components/ui/custom-tab"
import { Header } from "@/components/header"

import { AgendaDetail } from "./detail"
import { NavLinks } from "../navs"

export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams

  const calendar = await getCalendar({ page: Number(page ?? 1) })

  return (
    <div className="w-full h-full">
      <div className="h-full max-md:hidden">
        <SWRConfig
          value={{
            fallback: {
              calendar: calendar,
            },
            revalidateOnFocus: false,
            revalidateIfStale: true,
            revalidateOnReconnect: false,
            refreshInterval: 0,
          }}
        >
          <AgendaDetail />
        </SWRConfig>
      </div>

      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between md:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-2 pb-24 bg-[#BBE2E7] bg-cover bg-center h-[380px] w-full lg:hidden -mb-6 z-0">
          <Header title="Configurações" />
        </div>

        <div className="bg-white relative z-10 w-full max-lg:h-fit flex flex-col rounded-t-4xl mt px-4 py-10 max-lg:pb-0">
          <div className="max-h-[260px]">
            <div className="flex flex-col items-center gap-[17px] relative -top-18">
              <div className="flex w-[86px] h-[86px] items-center justify-center bg-[#ECF7F8] rounded-[30px]">
                <BiCalendarCheck className="w-[46px] h-[46px] text-[#348C98]" />
              </div>

              <h2 className="text-[20px] text-[#3D3D3D] font-bold">Agendas</h2>
            </div>

            <CustomTab tabs={NavLinks} />

            <SWRConfig
              value={{
                fallback: {
                  calendar: calendar,
                },
                revalidateOnFocus: false,
                revalidateIfStale: true,
                revalidateOnReconnect: false,
                refreshInterval: 0,
              }}
            >
              <AgendaDetail />
            </SWRConfig>
          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

import Link from "next/link"

import { useSearchParams } from "next/navigation"

import { BiCalendarCheck } from "react-icons/bi"

import { ArrowLeft } from "lucide-react"
import { DialogDeleteCalendar } from "../components/dialog-delete-calendar"

export function Sidebar() {
  const searchParams = useSearchParams()

  const name = searchParams.get("name")

  return (
    <div className="flex flex-col gap-6">
      <Link href="/setting/agenda">
        <button className="max-md:hidden cursor-pointer flex w-fit px-[30px] py-3 items-center gap-2 rounded-full border border-[#CDEDF0] bg-white text-[#2C8B94] shadow-sm hover:bg-[#f7fdfd] transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base font-medium">Voltar</span>
        </button>
      </Link>

      <aside className="h-fit shadow-md rounded-2xl py-4 px-5 space-y-6 md:space-y-0 max-md:hidden">
        <div className="w-full flex flex-col items-center">
          <div className="flex w-[86px] h-[86px] items-center justify-center bg-[#ECF7F8] rounded-[30px]">
            <BiCalendarCheck className="w-[52px] h-[52px] text-[#348C98]" />
          </div>

          {name && (
            <h2 className="text-[18px] text-[#3D3D3D] font-semibold mt-3">
              {name}
            </h2>
          )}
        </div>

        <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200" />

        <DialogDeleteCalendar name={name ?? ""} />
      </aside>
    </div>
  )
}

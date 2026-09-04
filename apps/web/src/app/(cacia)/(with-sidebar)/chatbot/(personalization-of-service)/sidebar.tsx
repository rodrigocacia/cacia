"use client"

import { Icon } from "@iconify/react/dist/iconify.js"

export function Sidebar() {
  return (
    <aside className="w-full h-fit shadow-md rounded-2xl py-4 px-5 space-y-6 md:space-y-0 max-lg:hidden">
      <div className="w-full flex flex-col items-center gap-3">
        <div className="flex w-[86px] h-[86px] items-center justify-center bg-[#ECF7F8] rounded-[30px]">
          <Icon
            icon="mdi:assistant"
            className="w-[46px] h-[46px] text-[#348C98]"
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-[18px] text-[#3D3D3D] font-semibold">
            I.A. Atendimento
          </h2>
        </div>
      </div>
    </aside>
  )
}

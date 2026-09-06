"use client"

import Link from "next/link"

import { Icon } from "@/components/icone"
import { navLinks } from "./navs"
import { useSearchParams } from "next/navigation"

export function Sidebar() {
  const pathname = useSearchParams()

  const type = pathname.get("type") ?? "all"

  return (
    <aside className="h-fit shadow-md rounded-2xl py-4 px-5 space-y-6 md:space-y-0 max-md:hidden">
      <div className="w-full flex flex-col items-center gap-3">
        <div className="flex w-[86px] h-[86px] items-center justify-center bg-[#ECF7F8] rounded-[30px]">
          <Icon
            icon="ion:notifcations"
            className="w-[46px] h-[46px] text-[#348C98]"
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-[18px] text-[#3D3D3D] font-semibold">
            Central de notificações
          </h2>
        </div>
      </div>

      <hr className="my-6 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <ul className="flex flex-col gap-4 max-md:hidden">
        {navLinks.map((link) => (
          <Link key={link.id} href={link.path}>
            <li
              className={
                link.param === type
                  ? "w-[full] max-md:w-[150px] list-none flex pl-3 py-2.5 bg-[#ECF7F8] rounded-full cursor-pointer items-center gap-4"
                  : "w-full max-md:w-[150px] list-none flex pl-3 py-2.5 rounded-md cursor-pointer items-center gap-4"
              }
            >
              {link.icon && (
                <span
                  className={
                    link.param === type ? "text-[#348C98]" : "text-[#BDBDBD]"
                  }
                >
                  {link.icon}
                </span>
              )}

              <span className="text-base text-[#3D3D3D]">{link.name}</span>
            </li>
          </Link>
        ))}
      </ul>
    </aside>
  )
}

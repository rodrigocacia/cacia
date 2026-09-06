"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Icon } from "@/components/icone"

import { NavLinks } from "./navs"

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => !!pathname.includes(path)

  return (
    <aside className="h-fit shadow-md rounded-2xl py-4 px-5 space-y-6 md:space-y-0 max-md:hidden">
      <div className="w-full flex flex-col items-center">
        <div className="flex w-[86px] h-[86px] items-center justify-center bg-[#ECF7F8] rounded-[30px]">
          <Icon
            icon="mdi:settings"
            className="w-[46px] h-[46px] text-[#348C98]"
          />
        </div>

        <h2 className="text-[18px] text-[#3D3D3D] font-semibold mt-3">
          Configurações
        </h2>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <ul className="flex w-full flex-col gap-4 max-md:hidden">
        {NavLinks.map((link) => (
          <Link key={link.id} href={link.path}>
            <li
              className={
                isActive(String(link.path))
                  ? "w-[full] max-md:w-[150px] list-none flex pl-3 py-2.5 bg-[#ECF7F8] rounded-full cursor-pointer items-center gap-4"
                  : "w-full max-md:w-[150px] list-none flex pl-3 py-2.5 rounded-md cursor-pointer items-center gap-4"
              }
            >
              {link.icon && (
                <span
                  className={
                    isActive(link.path) ? "text-[#348C98]" : "text-[#BDBDBD]"
                  }
                >
                  {link.icon}
                </span>
              )}

              <span
                className={
                  isActive(link.path)
                    ? "text-base text-[#3D3D3D] font-semibold"
                    : "text-base text-[#707070] font-semibold"
                }
              >
                {link.name}
              </span>
            </li>
          </Link>
        ))}
      </ul>
    </aside>
  )
}

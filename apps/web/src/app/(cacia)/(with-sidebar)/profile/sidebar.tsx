"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

import { CustomAvatar } from "@/components/ui/custom-avatar"

import { NavLinks } from "./navs"

interface SidebarProps {
  name: string
  email: string
}

export function Sidebar({ name, email }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (path: string) => !!pathname.includes(path)

  return (
    <aside className="w-full h-[544px] shadow-md rounded-2xl py-4 px-5 space-y-6 md:space-y-0 max-md:hidden">
      <div className="w-full flex flex-col items-center">
        <CustomAvatar name={name} size="lg" />

        <div className="mt-3 w-full flex flex-col gap-2 items-center justify-center">
          <h3 className="text-xl text-[#707070] text-center">{name}</h3>
          <p className="text-sm text-[#707070]">{email}</p>
        </div>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <ul className="flex w-full h-[450px] flex-col gap-4 max-md:hidden">
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
                className={cn(
                  "text-base text-[#3D3D3D]",
                  isActive(link.path) ? "font-bold" : "font-semibold"
                )}
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

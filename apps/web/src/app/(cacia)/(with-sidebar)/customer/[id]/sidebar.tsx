"use client"

import Link from "next/link"

import { useParams, usePathname } from "next/navigation"

import { DialogDeleteCustomer } from "./components/dialog-delete-customer"
import { CustomAvatar } from "@/components/ui/custom-avatar"
import { formatName } from "@/utils/formatters"

import { navLinks } from "./navs"
import { ButtonEditCustomer } from "./components/button-edit-customer"
import { DialogEditCustomer } from "./components/dialog-edit-customer"

export function Sidebar({
  name,
  createdAt,
}: {
  name: string
  createdAt: string
}) {
  const pathname = usePathname()
  const params = useParams()

  const customerId = params.id

  const isActive = (path: string) => !!pathname.includes(path)

  return (
    <aside className="shadow-md rounded-2xl py-4 px-5 space-y-6 md:space-y-0 max-md:hidden">
      <div className="flex flex-col items-center">
        <CustomAvatar name={name} size="lg" />

        <div className="mt-3 w-full flex flex-col gap-2 items-center justify-center">
          <h3 className="text-xl text-[#707070]">{formatName(name)}</h3>
          <p className="text-sm text-[#707070]">Cliente desde {createdAt}</p>
        </div>
      </div>

      <hr className="my-6 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <ul className="flex flex-col gap-4 max-md:hidden">
        {navLinks(String(customerId)).map((link) => (
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

              <span className="text-base text-[#3D3D3D]">{link.name}</span>
            </li>
          </Link>
        ))}
      </ul>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <div className="flex flex-row gap-3 w-full justify-between">
        <ButtonEditCustomer customerId={String(customerId)} />
        <DialogDeleteCustomer name={formatName(name ?? "")} />
      </div>

      <DialogEditCustomer />
    </aside>
  )
}

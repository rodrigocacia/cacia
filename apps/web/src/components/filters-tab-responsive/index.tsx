"use client"

import React, { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface FiltersTabResponsiveProps {
  showWeb?: boolean
  filters: {
    id: string
    name: string
    status: string
    icon: React.JSX.Element | null
  }[]
}

export function FiltersTabResponsive({
  showWeb = false,
  filters,
}: FiltersTabResponsiveProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get("status") || ""

  const [selectedStatus, setSelectedStatus] = useState(currentStatus)

  const handleClick = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("status", status)
    router.push(`${pathname}?${params.toString()}`)
    setSelectedStatus(status)
  }

  return (
    <div
      className={`flex flex-col mt-3.5 gap-2.5 ${showWeb ? "" : "md:hidden"}`}
    >
      <h3 className="text-[10px] text-[#BDBDBD]">FILTRAGEM RÁPIDA</h3>

      <div className="overflow-x-auto">
        <div className="flex w-full min-w-max items-center gap-1.5">
          {filters.map((link) => {
            const isActive = link.status === selectedStatus

            return (
              <button
                key={link.id}
                onClick={() => handleClick(link.status)}
                className={`relative flex items-center justify-center px-3 py-[9px] rounded-[100px] border border-[#F6F6F9] text-sm font-medium ${
                  isActive ? "bg-[#ECF7F8]" : "bg-white"
                }`}
              >
                {link.icon && (
                  <span className="mr-2 flex items-center justify-center">
                    {React.cloneElement(link.icon, {
                      className: `w-4 h-4 ${
                        isActive ? "text-[#348C98]" : "text-[#BDBDBD]"
                      }`,
                    })}
                  </span>
                )}

                <span
                  className={`text-sm font-bold ${
                    isActive ? "text-[#348C98]" : "text-[#BDBDBD]"
                  }`}
                >
                  {link.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

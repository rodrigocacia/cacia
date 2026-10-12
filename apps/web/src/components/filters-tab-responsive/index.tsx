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
    <div className={`mt-4 flex flex-col gap-2 ${showWeb ? "" : "md:hidden"}`}>
      <h3 className="rotulo">Status</h3>

      <div className="overflow-x-auto">
        <div className="flex w-full min-w-max items-center gap-1.5">
          {filters.map((link) => {
            const isActive = link.status === selectedStatus

            return (
              <button
                key={link.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleClick(link.status)}
                className={`relative flex h-8 cursor-pointer items-center justify-center rounded-lg border px-3 text-[13px] transition-colors ${
                  isActive
                    ? "border-acao bg-nevoa"
                    : "border-filete-forte bg-white hover:bg-gray-100"
                }`}
              >
                {link.icon && (
                  <span className="mr-2 flex items-center justify-center">
                    {React.cloneElement(link.icon, {
                      className: `w-4 h-4 ${
                        isActive ? "text-turquesa-profundo" : "text-tinta-3"
                      }`,
                    })}
                  </span>
                )}

                <span
                  className={
                    isActive
                      ? "font-semibold text-turquesa-profundo"
                      : "font-medium text-tinta-2"
                  }
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

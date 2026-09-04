"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Icon } from "@iconify/react"

type PaginationProps = {
  totalItems: number
  totalPages: number
  perPage: number
  currentPage: number
}

export function CustomPagination({
  totalItems,
  totalPages,
  perPage,
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentPage = Number(searchParams.get("page")) || 1
  const end = Math.min(currentPage * perPage, totalItems)

  const canGoBack = currentPage > 1
  const canGoForward = currentPage < totalPages

  const backButtonColor =
    canGoBack && totalPages > 1
      ? "bg-[#348C98]"
      : "bg-[#F2F2F2] cursor-not-allowed"

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", String(page))
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="w-full flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h3 className="text-sm text-[#BDBDBD] text-center md:text-left">
        Mostrando{" "}
        <strong className="text-sm text-[#707070] font-semibold">{end}</strong>{" "}
        de{" "}
        <strong className="text-sm text-[#707070] font-semibold">
          {totalItems}
        </strong>{" "}
        registros
      </h3>

      <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-4 md:mb-0">
        <button
          disabled={!canGoBack}
          onClick={() => goToPage(currentPage - 1)}
          className={`w-8 h-8 rounded-full flex items-center justify-center ${backButtonColor}`}
        >
          <Icon
            icon="mdi:arrow-left"
            className={
              canGoBack && totalPages > 1
                ? "text-white cursor-pointer"
                : "text-[#707070]"
            }
          />
        </button>

        <div className="rounded-[10px] border border-[#F6F6F9] flex gap-2 md:gap-3 px-2 md:px-3 py-2 ">
          <span className="text-sm text-[#707070] font-semibold">
            {currentPage}
          </span>
          <Icon icon="mdi:chevron-down" className="text-[#BDBDBD]" />
        </div>

        <h3 className="text-sm">
          de{" "}
          <span className="text-sm text-[#707070] font-semibold">
            {totalPages}
          </span>
        </h3>

        <button
          disabled={!canGoForward}
          onClick={() => goToPage(currentPage + 1)}
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            canGoForward
              ? "bg-[#348C98] cursor-pointer"
              : "bg-[#B0B0B0] cursor-not-allowed"
          }`}
        >
          <Icon icon="mdi:arrow-right" className="text-white" />
        </button>
      </div>
    </div>
  )
}

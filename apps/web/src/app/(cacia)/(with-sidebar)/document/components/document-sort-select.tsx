"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { documentSortOptions } from "@/constants/filters/document"
import { HiMiniBars3BottomLeft } from "react-icons/hi2"
import { BiSolidChevronDown } from "react-icons/bi"
import { useState, useRef, useEffect } from "react"

export function DocumentSortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentSort = searchParams.get("sortBy") || "newest"
  const selectedOption = documentSortOptions.find(
    (option) => option.value === currentSort
  )

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams({
      ...Object.fromEntries(searchParams.entries()),
    })

    if (value === "newest") {
      params.delete("sortBy")
    } else {
      params.set("sortBy", value)
    }

    params.delete("page")

    router.push(`${pathname}?${params.toString()}`)
    setIsOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="flex items-center gap-2 max-md:w-full max-md:flex-col max-md:items-start">
      <h3 className="text-[10px] font-semibold tracking-wide text-[#BDBDBD] max-md:hidden">
        ORDENAR POR
      </h3>
      <div className="relative w-[193px] max-md:w-full" ref={dropdownRef}>
        <div
          className="flex h-11 cursor-pointer items-center justify-between rounded-full border border-[#E7E7EE] bg-white px-4 transition-colors hover:border-[#D5D5E0]"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex h-full items-center gap-2.5">
            <HiMiniBars3BottomLeft size={18} className="text-[#348C98]" />
            <span className="text-sm font-semibold text-[#707070]">
              {selectedOption?.name || "Mais recentes"}
            </span>
          </div>
          <BiSolidChevronDown
            size={18}
            className={`text-[#BDBDBD] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 z-10 mt-1.5 max-h-60 overflow-auto rounded-2xl border border-[#EDEDF2] bg-white p-1 text-sm shadow-lg">
            {documentSortOptions.map((option) => (
              <div
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-[#F6F6F9] ${
                  currentSort === option.value
                    ? "bg-[#ECF7F8] font-semibold text-[#348C98]"
                    : "text-[#707070]"
                }`}
                onClick={() => handleSortChange(option.value)}
              >
                {option.icon}
                {option.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

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
    <div className="max-md:w-full flex max-md:flex-col max-md:items-start items-center gap-1.5">
      <h3 className="text-[10px] text-[#BDBDBD] font-semibold">ORDENAR POR</h3>
      <div className="relative w-[193px]" ref={dropdownRef}>
        <div
          className="h-[36px] bg-white rounded-[10px] px-3 flex items-center justify-between border border-[#F6F6F9] cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="h-full flex items-center gap-3">
            <HiMiniBars3BottomLeft size={20} className="text-[#348C98]" />
            <span className="text-sm text-[#707070] font-bold">
              {selectedOption?.name || "Mais recentes"}
            </span>
          </div>
          <BiSolidChevronDown
            size={20}
            className={`text-[#BDBDBD] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto text-sm z-10">
            {documentSortOptions.map((option) => (
              <div
                key={option.value}
                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 ${
                  currentSort === option.value
                    ? "bg-gray-50 text-[#348C98]"
                    : "text-gray-700"
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

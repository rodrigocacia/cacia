"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { documentSortOptions } from "@/constants/filters/document"
import { ArrowDownUp, ChevronDown } from "lucide-react"
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
      <span className="rotulo max-md:hidden">Ordenar por</span>
      <div className="relative w-[193px] max-md:w-full" ref={dropdownRef}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="flex h-11 w-full cursor-pointer items-center justify-between rounded-[10px] border border-filete-forte bg-white px-3.5 transition-colors hover:bg-gray-100"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex h-full items-center gap-2">
            <ArrowDownUp size={15} strokeWidth={1.7} className="text-tinta-3" />
            <span className="text-[13.5px] font-medium text-tinta">
              {selectedOption?.name || "Mais recentes"}
            </span>
          </span>
          <ChevronDown
            size={16}
            className={`text-tinta-3 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 left-0 z-10 mt-1.5 max-h-60 overflow-auto rounded-[10px] border border-filete bg-white p-1 text-[13.5px] shadow-[0_12px_32px_rgba(21,19,17,0.12)]">
            {documentSortOptions.map((option) => (
              <div
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 ${
                  currentSort === option.value
                    ? "bg-nevoa font-semibold text-turquesa-profundo"
                    : "text-tinta-2"
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

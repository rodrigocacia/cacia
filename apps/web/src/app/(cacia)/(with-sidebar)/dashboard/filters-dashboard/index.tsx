"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { MdCalendarToday } from "react-icons/md"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FiltersPanel } from "@/components/filters-panel"

const periodOptions = [
  { value: "-", label: "Todos os períodos" },
  { value: ".1", label: "Última hora" },
  { value: "1", label: "Últimas 24 horas" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "15", label: "Últimos 15 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "custom", label: "Personalizado" },
]

export function FiltersDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const hasCustomDates =
    searchParams.get("startDate") && searchParams.get("endDate")

  const [selectedPeriod, setSelectedPeriod] = useState(
    hasCustomDates ? "custom" : searchParams.get("period") || "-"
  )
  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || ""
  )
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "")

  useEffect(() => {
    if (startDate && endDate) {
      setSelectedPeriod("custom")
    }
  }, [startDate, endDate])

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)

    const params = new URLSearchParams({
      ...Object.fromEntries(searchParams.entries()),
    })

    if (value !== "custom") {
      params.set("period", value)
      params.delete("startDate")
      params.delete("endDate")
      setStartDate("")
      setEndDate("")
    } else {
      params.delete("period")
    }

    router.push(`?${params.toString()}`)
  }

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)

    const params = new URLSearchParams({
      ...Object.fromEntries(searchParams.entries()),
    })

    if (start) {
      params.set("startDate", start)
    } else {
      params.delete("startDate")
    }

    if (end) {
      params.set("endDate", end)
    } else {
      params.delete("endDate")
    }

    if (start && end) {
      params.delete("period")
    }

    router.push(`?${params.toString()}`)
  }

  const selectedPeriodLabel =
    periodOptions.find((option) => option.value === selectedPeriod)?.label ||
    "Todos os períodos"

  return (
    <div className="w-full flex flex-wrap sm:flex-row items-start sm:items-center gap-4 justify-end mt-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="lg:min-w-[219px] w-fit max-md:w-full flex items-center justify-between sm:justify-start gap-3 px-4 py-2 max-md:h-9 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <MdCalendarToday className="w-5 h-5 text-teal-600 max-md:hidden" />
              <span className="text-gray-700  font-medium max-md:text-sm whitespace-nowrap">
                {selectedPeriodLabel}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 sm:ml-auto" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full sm:w-48">
          {periodOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handlePeriodChange(option.value)}
              className="cursor-pointer max-md:text-sm"
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <FiltersPanel
        filters={[]}
        showDateFilter={true}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        showResponsive={true}
      />
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"

import { useRouter, useSearchParams } from "next/navigation"

export function TabCalendarType() {
  const [tab, setTab] = useState("month")

  const router = useRouter()

  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setTab(tab)
    }
  }, [searchParams])

  const handleTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)

    if (value === "day" && !params.get("selectedDate")) {
      const today = new Date()
      params.set("selectedDate", today.toISOString().split("T")[0]) // formato YYYY-MM-DD
    }

    router.push(`?${params.toString()}`)

    setTab(value)
  }

  return (
    <div
      role="group"
      aria-label="Visualização da agenda"
      className="flex gap-0.5 rounded-[9px] border border-filete bg-[#F1EEE8] p-[3px]"
    >
      {[
        { name: "Dia", value: "day" },
        { name: "Semana", value: "week" },
        { name: "Mês", value: "month" },
      ].map((day) => (
        <button
          type="button"
          key={day.name}
          aria-pressed={tab === day.value}
          className={`h-8 cursor-pointer rounded-[7px] px-3.5 text-[13px] transition-colors ${
            tab === day.value
              ? "bg-white font-semibold text-tinta shadow-[0_1px_2px_rgba(21,19,17,0.08)]"
              : "font-medium text-tinta-3 hover:text-tinta"
          }`}
          onClick={() => handleTab(day.value)}
        >
          {day.name}
        </button>
      ))}
    </div>
  )
}

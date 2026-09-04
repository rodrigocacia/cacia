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
    <div className="h-[40px] w-fit p-1 flex items-center bg-white shadow-md rounded-4xl">
      {[
        { name: "Dia", value: "day" },
        { name: "Semana", value: "week" },
        { name: "Mês", value: "month" },
      ].map((day) => (
        <div
          key={day.name}
          className={`cursor-pointer h-[32px] px-2 flex items-center ${
            tab === day.value ? "bg-[#ECF7F8]" : ""
          } items-center justify-center py-2 px-4 rounded-4xl`}
          onClick={() => handleTab(day.value)}
        >
          <span
            className={`font-semibold font-plus-jakarta-sans ${
              tab === day.value ? "text-[#348C98]" : "text-[#707070]"
            } `}
          >
            {day.name}
          </span>
        </div>
      ))}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"

import { CustomSelect } from "@/components/ui/custom-select"
import { useRouter, useSearchParams } from "next/navigation"

export function SelectRange() {
  const [range, setRange] = useState("today")

  const router = useRouter()

  const searchParams = useSearchParams()

  useEffect(() => {
    const range = searchParams.get("date")
    if (range) {
      setRange(range)
    }
  }, [searchParams])

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("date", value)

    router.push(`?${params.toString()}`)

    setRange(value)
  }

  return (
    <CustomSelect
      options={[
        {
          label: "Hoje",
          value: "today",
        },
        {
          label: "Semana",
          value: "week",
        },
        {
          label: "Mês",
          value: "month",
        },
      ]}
      value={range}
      onChange={handleChange}
      placeholder="Data"
      variant="compact"
      iconName="calendar"
    />
  )
}

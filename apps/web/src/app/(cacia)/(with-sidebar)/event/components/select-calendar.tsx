"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { CustomSelect } from "@/components/ui/custom-select"
import { Calendar } from "@/types/calendar"
interface SelectCalendarProps {
  calendars: Calendar[]
}

export function SelectCalendar({ calendars }: SelectCalendarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [selected, setSelected] = useState<string | undefined>(undefined)

  const eventId = searchParams.get("eventId")

  useEffect(() => {
    if (calendars.length === 0) return

    const calendarId = searchParams.get("calendar") || calendars[0]._id
    setSelected(calendarId)

    if (!searchParams.get("calendar")) {
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.set("calendar", calendarId)
      if (eventId) {
        newParams.set("eventId", eventId)
      }

      router.replace(`?${newParams.toString()}`, { scroll: false })
    }
  }, [searchParams, calendars, router, eventId])

  const handleChange = (value: string) => {
    setSelected(value)

    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set("calendar", value)
    router.push(`?${newParams.toString()}`, { scroll: false })
  }

  return (
    <CustomSelect
      options={[
        {
          label: "Todas as agendas",
          value: "all",
        },
        ...calendars.map((calendar) => ({
          label: calendar.title,
          value: calendar._id,
        })),
      ]}
      value={selected}
      onChange={handleChange}
      placeholder="Nome da agenda"
      iconName="calendarCheck"
    />
  )
}

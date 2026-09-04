"use client"

import { useState } from "react"

import clsx from "clsx"

import { ChevronLeft, ChevronRight } from "lucide-react"

import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  subDays,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns"

import { ptBR } from "date-fns/locale"

import { Event, EventType } from "@/types/event"

import { useCalendarStore } from "@/stores/use-calendar-store"
import { useRouter, useSearchParams } from "next/navigation"

const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"]

interface CalendarMonthProps {
  events: Event[]
}

export function CalendarMonth({ events }: CalendarMonthProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const currentMonth = useCalendarStore((state) => state.currentMonth)

  const setCurrentMonth = useCalendarStore((state) => state.setMonth)

  const router = useRouter()

  const searchParams = useSearchParams()

  const currentTab = searchParams.get("tab") || "month"

  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
  const end = addDays(endOfMonth(currentMonth), 6)

  const weeks = []
  let day = start
  while (day <= end) {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push(day)
      day = addDays(day, 1)
    }
    weeks.push(week)
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date)
    setCurrentMonth(date)

    const params = new URLSearchParams(searchParams.toString())

    params.set("selectedDate", format(date, "yyyy-MM-dd"))

    if (currentTab !== "day") {
      params.set("day", format(date, "yyyy-MM-dd"))
    }

    router.push(`?${params.toString()}`)
  }

  const handleNavigation = (direction: "prev" | "next") => {
    let newDate: Date

    switch (currentTab) {
      case "day":
        newDate =
          direction === "next"
            ? addDays(currentMonth, 1)
            : subDays(currentMonth, 1)
        break
      case "week":
        newDate =
          direction === "next"
            ? addWeeks(currentMonth, 1)
            : subWeeks(currentMonth, 1)
        break
      case "month":
      default:
        newDate =
          direction === "next"
            ? addMonths(currentMonth, 1)
            : subMonths(currentMonth, 1)
        break
    }

    setCurrentMonth(newDate)

    const params = new URLSearchParams(searchParams.toString())

    if (currentTab === "day") {
      params.set("selectedDate", format(newDate, "yyyy-MM-dd"))
    }

    params.set("month", format(newDate, "yyyy-MM"))
    router.push(`?${params.toString()}`)
  }

  const getFormattedTitleDay = () => {
    switch (currentTab) {
      case "day":
        return format(currentMonth, "d MMMM ", { locale: ptBR })
      case "week":
        const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 })
        const weekEnd = addDays(weekStart, 6)
        return `${format(weekStart, "d", { locale: ptBR })} - ${format(
          weekEnd,
          "d MMMM",
          { locale: ptBR }
        )}`
      case "month":
      default:
        return format(currentMonth, "MMMM", { locale: ptBR })
    }
  }

  const getFormattedTitle = () => {
    return format(currentMonth, "yyyy", { locale: ptBR })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg text-[#3D3D3D]">
          <b>{getFormattedTitleDay()}</b> {getFormattedTitle()}
        </h2>
        <div className="flex gap-2">
          <button
            className="cursor-pointer p-2 rounded-full bg-[#ECF7F8] flex items-center justify-center"
            onClick={() => handleNavigation("prev")}
          >
            <ChevronLeft className="w-4 h-4 text-[#348C98]" />
          </button>
          <button
            className="cursor-pointer p-2 rounded-full bg-[#ECF7F8] flex items-center justify-center"
            onClick={() => handleNavigation("next")}
          >
            <ChevronRight className="w-4 h-4 text-[#348C98]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-sm text-[#9CA3AF] font-semibold">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-2 space-y-1">
        {weeks.map((week, i) => (
          <div key={i} className="grid grid-cols-7">
            {week.map((day, j) => {
              const eventsList = Object.values(
                events
                  .filter((event) => isSameDay(parseISO(event.start_time), day))
                  .reduce(
                    (acc, event) => {
                      if (!acc[event.type]) {
                        acc[event.type] = event
                      }
                      return acc
                    },
                    {} as Record<EventType, (typeof events)[0]>
                  )
              )
              const isSelected = isSameDay(day, selectedDate)
              const isInactive = !isSameMonth(day, currentMonth)

              return (
                <div
                  key={j}
                  onClick={() => handleSelectDate(day)}
                  className={clsx(
                    "flex flex-col w-[30px] h-[30px] items-center justify-center cursor-pointer rounded-[8px] max-lg:rounded-[10px] text-sm font-medium",
                    {
                      "bg-[#348C98] text-white": isSelected,
                      "hover:bg-gray-100": !isSelected,
                      "text-[#D1D5DB]": isInactive,
                      "text-[#3D3D3D]": !isInactive,
                    }
                  )}
                >
                  {format(day, "d")}

                  <div className="flex gap-[2px] mt-[2px]">
                    {eventsList.map((event, i) => (
                      <span
                        key={i}
                        className={clsx("w-[4px] h-[4px] rounded-full", {
                          "bg-[#9333EA]": event.type === EventType.HEARING,
                          "bg-[#16A31B]": event.type === EventType.DEADLINE,
                          "bg-[#EA820C]": event.type === EventType.INQUIRY,
                          "bg-[#2563EB]": event.type === EventType.MEETING,
                          "bg-[#1E40AF]": event.type === EventType.SERVICE,
                          "bg-[#158f89]": event.type === EventType.COMMITMENT,
                        })}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

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
  isToday,
  parseISO,
} from "date-fns"

import { ptBR } from "date-fns/locale"

import { Event } from "@/types/event"

import { ehPrazo } from "./estilo-do-evento"

import { useCalendarStore } from "@/stores/use-calendar-store"
import { useRouter, useSearchParams } from "next/navigation"

const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

const BOTAO_NAV =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-filete-forte bg-white text-tinta-2 transition-colors hover:bg-gray-100 hover:text-tinta"

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
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-[22px] leading-none text-tinta first-letter:uppercase">
          {getFormattedTitleDay()}{" "}
          <span className="text-tinta-3">{getFormattedTitle()}</span>
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Anterior"
            className={BOTAO_NAV}
            onClick={() => handleNavigation("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Próximo"
            className={BOTAO_NAV}
            onClick={() => handleNavigation("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center">
        {daysOfWeek.map((day) => (
          <div key={day} className="rotulo py-1.5">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-1 space-y-0.5">
        {weeks.map((week, i) => (
          <div key={i} className="grid grid-cols-7 justify-items-center">
            {week.map((day, j) => {
              const doDia = events.filter((event) =>
                isSameDay(parseISO(event.start_time), day)
              )
              const temPrazo = doDia.some((event) => ehPrazo(event.type))
              const temOutro = doDia.some((event) => !ehPrazo(event.type))
              const isSelected = isSameDay(day, selectedDate)
              const isInactive = !isSameMonth(day, currentMonth)
              const hoje = isToday(day)

              return (
                <button
                  type="button"
                  key={j}
                  onClick={() => handleSelectDate(day)}
                  aria-pressed={isSelected}
                  aria-label={format(day, "d 'de' MMMM", { locale: ptBR })}
                  className={clsx(
                    "tabular relative flex h-9 w-9 cursor-pointer flex-col items-center justify-center rounded-md text-[13px] transition-colors",
                    {
                      "bg-acao font-semibold text-white": isSelected,
                      "font-semibold text-turquesa-profundo ring-1 ring-acao ring-inset":
                        hoje && !isSelected,
                      "hover:bg-gray-100": !isSelected,
                      "text-gray-400": isInactive && !isSelected,
                      "text-tinta": !isInactive && !isSelected && !hoje,
                    }
                  )}
                >
                  {format(day, "d")}

                  {(temPrazo || temOutro) && (
                    <span className="absolute bottom-1 flex gap-[2px]">
                      {temOutro && (
                        <span
                          className={clsx(
                            "h-1 w-1 rounded-full",
                            isSelected ? "bg-white" : "bg-acao"
                          )}
                        />
                      )}
                      {temPrazo && (
                        <span
                          className={clsx(
                            "h-1 w-1 rounded-full",
                            isSelected ? "bg-white" : "bg-ambar-ponto"
                          )}
                        />
                      )}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

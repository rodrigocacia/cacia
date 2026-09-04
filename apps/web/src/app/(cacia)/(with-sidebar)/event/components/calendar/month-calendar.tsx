"use client"

import { JSX } from "react"

import { useRouter, useSearchParams } from "next/navigation"

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  subDays,
  format,
  isSameMonth,
} from "date-fns"

import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Event } from "@/types/event"

import { useCalendarStore } from "@/stores/use-calendar-store"

import CardCalendar from "../card-calendar"
import { EventDetail } from "./event-detail"
import { formatTime } from "@/utils/formatters"

export const MonthCalendar = ({ events }: { events: Event[] }) => {
  const currentMonth = useCalendarStore((state) => state.currentMonth)
  const setCurrentMonth = useCalendarStore((state) => state.setMonth)
  const router = useRouter()

  const searchParams = useSearchParams()

  const eventId = searchParams.get("eventId")
  const currentTab = searchParams.get("tab") || "month"

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

  const renderDayHeader = () => {
    const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 6)

    return (
      <div className="grid grid-cols-[60px_1fr] border-gray-200">
        <div className="bg-[#FCFCFD]" />
        <div className="px-4 py-3 text-sm font-medium">
          <div className="text-2xl text-[#707070] font-semibold">
            {format(weekEnd, "MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        </div>
      </div>
    )
  }

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-lg font-bold text-[#3D3D3D]">
          {renderDayHeader()}
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
    )
  }

  const renderDays = () => {
    const weekDays = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"]
    return (
      <div className="grid grid-cols-7 gap-px bg-[#F6F6F9]">
        {weekDays.map((day, i) => (
          <div
            key={i}
            className="bg-[#FCFCFD] flex items-start px-2 py-2 text-sm font-medium"
          >
            <span className="text-xl text-[#BDBDBD] font-semibold">{day}</span>
          </div>
        ))}
      </div>
    )
  }

  function handleSelectEvent(event: Event) {
    if (eventId === event._id) {
      const params = new URLSearchParams(searchParams)
      params.delete("eventId")
      router.push(`?${params.toString()}`)
    }

    const params = new URLSearchParams(searchParams)
    params.set("eventId", event._id)
    router.push(`?${params.toString()}`)
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })

    const rows: JSX.Element[] = []
    let days: JSX.Element[] = []
    let day = startDate

    while (day <= monthEnd || days.length % 7 !== 0) {
      for (let i = 0; i < 7; i++) {
        const eventsWithFormattedDate = events.map((event) => ({
          ...event,
          start_time: format(event.start_time, "yyyy-MM-dd"),
          formatted_start_hour: formatTime(event.start_time),
          formatted_end_hour: formatTime(event.end_time),
        }))

        const formattedDate = format(day, "yyyy-MM-dd")
        const isCurrentMonth = isSameMonth(day, monthStart)
        const dayEvents = eventsWithFormattedDate.filter(
          (event) => formattedDate === event.start_time
        )

        days.push(
          <div
            key={day.toString()}
            className={`p-2 border-0.5 border-[#F6F6F9] min-h-36 flex flex-col gap-2 overflow-y-auto ${
              isCurrentMonth ? "bg-white" : "bg-[#FCFCFD] text-gray-400"
            }`}
          >
            <div
              className={`text-base font-semibold ${
                isCurrentMonth ? "text-[#707070]" : "text-[#BDBDBD]"
              }`}
            >
              {format(day, "d")}
            </div>
            {dayEvents.map((event, idx) => (
              <div key={idx} onClick={() => handleSelectEvent(event)}>
                <CardCalendar
                  title={event.title}
                  start_hour={event.formatted_start_hour}
                  end_hour={event.formatted_end_hour}
                  status={event.status}
                  variant={event.type}
                />
              </div>
            ))}
          </div>
        )

        day = addDays(day, 1)
      }

      rows.push(
        <div
          key={day.toString()}
          className="grid grid-cols-7 gap-px bg-[#F6F6F9]"
        >
          {days}
        </div>
      )
      days = []
    }

    return <>{rows}</>
  }

  return (
    <div className="mt-6 bg-[#FCFCFD] flex flex-col">
      {renderHeader()}
      <div className="flex">
        <div className="flex-1">
          {renderDays()}
          <div className="gap-px bg-[#F6F6F9]">{renderCells()}</div>
        </div>

        {eventId ? <EventDetail /> : null}
      </div>
    </div>
  )
}

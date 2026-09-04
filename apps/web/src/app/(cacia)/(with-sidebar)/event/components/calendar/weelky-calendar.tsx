"use client"

import React from "react"

import { useRouter, useSearchParams } from "next/navigation"

import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  subDays,
  isSameDay,
  isWithinInterval,
  parseISO,
  getHours,
  getMinutes,
  set,
} from "date-fns"

import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Event } from "@/types/event"
import { useCalendarStore } from "@/stores/use-calendar-store"
import CardCalendar from "../card-calendar"

import { EventDetail } from "./event-detail"
import { formatTime } from "@/utils/formatters"

export const WeekCalendar = ({ events }: { events: Event[] }) => {
  const currentMonth = useCalendarStore((state) => state.currentMonth)
  const setCurrentMonth = useCalendarStore((state) => state.setMonth)

  const router = useRouter()
  const searchParams = useSearchParams()

  const eventId = searchParams.get("eventId")
  const currentTab = searchParams.get("tab") || "week"

  const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))
  const today = new Date()

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
    const weekEnd = addDays(weekStart, 6)

    return (
      <div className="grid grid-cols-[60px_1fr] border-gray-200">
        <div className="bg-[#FCFCFD]" />
        <div className="px-4 py-3 text-sm font-medium">
          <div className="text-2xl text-[#707070] font-semibold">
            {format(weekStart, "d", { locale: ptBR })} -{" "}
            {format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
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

  const renderDaysHeader = () => {
    const weekDays = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"]
    return (
      <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b border-gray-200">
        <div className="bg-[#FCFCFD]" />
        {days.map((day, idx) => (
          <div
            key={idx}
            className={`px-2 py-2 text-sm font-medium text-[#BDBDBD] ${
              isSameDay(day, today) ? "bg-[#DAEFF1]" : "bg-[#FCFCFD]"
            }`}
          >
            <div className="text-xs">{weekDays[idx]}</div>
            <div className="text-xl text-[#707070] font-semibold">
              {format(day, "d")}
            </div>
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

  const renderHourRows = () => {
    const hours = Array.from({ length: 24 }).map((_, i) => i)

    return (
      <div className="h-full grid bg-[#FCFCFD] grid-cols-[60px_repeat(7,minmax(0,1fr))] divide-x">
        {hours.map((hour, hourIdx) => (
          <React.Fragment key={hourIdx}>
            <div className="h-full -mt-1.5 text-xs text-right pr-1 pt-1 text-[#BDBDBD]">
              {`${hour.toString().padStart(2, "0")}:00`}
            </div>
            {days.map((day, dayIdx) => {
              const isToday = isSameDay(day, today)
              const dayStart = set(new Date(day), {
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
              })
              const dayEnd = set(new Date(day), {
                hours: 23,
                minutes: 59,
                seconds: 59,
                milliseconds: 999,
              })

              const dayEvents = events.filter((event) => {
                const start = parseISO(event.start_time)
                return isWithinInterval(start, { start: dayStart, end: dayEnd })
              })

              const eventsThisHour = dayEvents.filter((event) => {
                const start = parseISO(event.start_time)
                return getHours(start) === hour && isSameDay(start, day)
              })

              return (
                <div
                  key={dayIdx}
                  className={`border-t border-gray-100 h-20 p-1 relative ${
                    isToday ? "bg-[#F4FAFB]" : "bg-white"
                  }`}
                >
                  {eventsThisHour.map((event, idx) => {
                    const start = formatTime(event.start_time)
                    const end = formatTime(event.end_time)
                    const topOffset = (getMinutes(start) / 60) * 100

                    return (
                      <div
                        key={idx}
                        className="absolute left-0 right-0 px-1 cursor-pointer"
                        style={{ top: `${topOffset}%`, minHeight: "2.5rem" }}
                        onClick={() => handleSelectEvent(event)}
                      >
                        <CardCalendar
                          title={event.title}
                          start_hour={start}
                          end_hour={end}
                          status={event.status}
                          variant={event.type}
                        />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-6 bg-[#FCFCFD] flex flex-col">
      {renderHeader()}
      <div className="flex">
        <div className="flex-1">
          {renderDaysHeader()}
          <div className="h-[800px]">{renderHourRows()}</div>
        </div>

        {eventId ? <EventDetail /> : null}
      </div>
    </div>
  )
}

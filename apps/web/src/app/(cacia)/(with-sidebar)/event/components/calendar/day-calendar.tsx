"use client"

import React, { useEffect } from "react"

import { useRouter, useSearchParams } from "next/navigation"

import {
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  getHours,
  getMinutes,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from "date-fns"

import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Event } from "@/types/event"
import { useCalendarStore } from "@/stores/use-calendar-store"
import CardCalendar from "../card-calendar"

import { EventDetail } from "./event-detail"
import { formatTime } from "@/utils/formatters"

export const DayCalendar = ({ events }: { events: Event[] }) => {
  const currentMonth = useCalendarStore((state) => state.currentMonth)
  const setCurrentMonth = useCalendarStore((state) => state.setMonth)

  const router = useRouter()
  const searchParams = useSearchParams()

  const eventId = searchParams.get("eventId")
  const currentTab = searchParams.get("tab") || "day"

  const currentDay = currentMonth
  const today = new Date()

  useEffect(() => {
    const selectedDate = searchParams.get("selectedDate")

    if (selectedDate && currentTab === "day") {
      const [year, month, day] = selectedDate.split("-").map(Number)
      const dateFromUrl = new Date(year, month - 1, day)
      setCurrentMonth(dateFromUrl)
    }
  }, [searchParams, currentTab, setCurrentMonth])

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

  const renderDayHeader = () => {
    const dayName = format(currentDay, "EEEE", { locale: ptBR })

    return (
      <div className="grid grid-cols-[60px_1fr] border-gray-200">
        <div className="bg-[#FCFCFD]" />
        <div className="px-0 py-3 text-sm font-medium bg-[#FCFCFD]">
          <div className="text-xs text-[#BDBDBD] uppercase font-semibold">
            {dayName}
          </div>
          <div className="text-2xl text-[#707070] font-semibold">
            {format(currentDay, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        </div>
      </div>
    )
  }

  function handleSelectEvent(event: Event) {
    if (eventId === event._id) {
      const params = new URLSearchParams(searchParams)
      params.delete("eventId")
      router.push(`?${params.toString()}`)
      return
    }

    const params = new URLSearchParams(searchParams)
    params.set("eventId", event._id)
    router.push(`?${params.toString()}`)
  }

  const renderHourRows = () => {
    const hours = Array.from({ length: 24 }).map((_, i) => i)
    const isToday = isSameDay(currentDay, today)

    const dayStart = startOfDay(currentDay)
    const dayEnd = endOfDay(currentDay)

    const dayEvents = events.filter((event) => {
      const start = parseISO(event.start_time)
      return isWithinInterval(start, { start: dayStart, end: dayEnd })
    })

    return (
      <div className="h-full grid bg-[#FCFCFD] grid-cols-[60px_1fr] divide-x">
        {hours.map((hour, hourIdx) => (
          <React.Fragment key={hourIdx}>
            <div className="h-full -mt-1.5 text-xs text-right pr-2 pt-1 text-[#BDBDBD] font-medium">
              {`${hour.toString().padStart(2, "0")}:00`}
            </div>

            <div
              className={`border-t border-gray-100 h-20 p-2 relative ${
                isToday ? "bg-[#F4FAFB]" : "bg-white"
              }`}
            >
              {dayEvents
                .filter((event) => {
                  const start = parseISO(event.start_time)
                  return (
                    getHours(start) === hour && isSameDay(start, currentDay)
                  )
                })
                .map((event, idx) => {
                  const start = formatTime(event.start_time)
                  const end = formatTime(event.end_time)
                  const topOffset = (getMinutes(start) / 60) * 100

                  const startMinutes = getHours(start) * 60 + getMinutes(start)
                  const endMinutes = getHours(end) * 60 + getMinutes(end)
                  const durationMinutes = endMinutes - startMinutes
                  const heightPercentage = Math.max(
                    (durationMinutes / 60) * 100,
                    25
                  ) // Mínimo 25% da altura da hora

                  return (
                    <div
                      key={idx}
                      className="absolute left-0 right-0 px-2 cursor-pointer z-10"
                      style={{
                        top: `${topOffset}%`,
                        height: `${heightPercentage}%`,
                        minHeight: "2.5rem",
                      }}
                      onClick={() => handleSelectEvent(event)}
                    >
                      <div className="h-full">
                        <CardCalendar
                          title={event.title}
                          start_hour={start}
                          end_hour={end}
                          status={event.status}
                          variant={event.type}
                        />
                      </div>
                    </div>
                  )
                })}

              {isToday && hour === new Date().getHours() && (
                <div
                  className="absolute left-0 right-0 border-t-2 border-red-500 z-20"
                  style={{
                    top: `${(new Date().getMinutes() / 60) * 100}%`,
                  }}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full -mt-1.5 -ml-1.5"></div>
                </div>
              )}
            </div>
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
          <div className="h-[full] overflow-y-auto">{renderHourRows()}</div>
        </div>
        {eventId ? <EventDetail /> : null}
      </div>
    </div>
  )
}

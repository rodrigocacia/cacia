"use client"

import React, { useEffect, useRef } from "react"

import { useRouter, useSearchParams } from "next/navigation"

import {
  format,
  isSameDay,
  isWithinInterval,
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

import { Event } from "@/types/event"
import { useCalendarStore } from "@/stores/use-calendar-store"
import CardCalendar from "../card-calendar"

import { EventDetail } from "./event-detail"
import { horarioDaAgenda } from "@/utils/horario-da-agenda"
import { CabecalhoDaGrade } from "./cabecalho-da-grade"

export const DayCalendar = ({ events }: { events: Event[] }) => {
  const currentMonth = useCalendarStore((state) => state.currentMonth)
  const setCurrentMonth = useCalendarStore((state) => state.setMonth)

  const router = useRouter()
  const searchParams = useSearchParams()

  const eventId = searchParams.get("eventId")
  const currentTab = searchParams.get("tab") || "day"

  const currentDay = currentMonth
  const today = new Date()

  // A grade tem as 24 horas; abre no começo do expediente (7h, 80 px por
  // hora) em vez da madrugada.
  const grade = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (grade.current) grade.current.scrollTop = 7 * 80
  }, [])

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

  const renderHeader = () => (
    <CabecalhoDaGrade
      sobretitulo={format(currentDay, "EEEE", { locale: ptBR })}
      titulo={format(currentDay, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
      aoNavegar={handleNavigation}
    />
  )

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
      const start = horarioDaAgenda(event.start_time)
      return isWithinInterval(start, { start: dayStart, end: dayEnd })
    })

    return (
      <div className="grid grid-cols-[56px_1fr]">
        {hours.map((hour, hourIdx) => (
          <React.Fragment key={hourIdx}>
            <div className="tabular h-full border-t border-[#F1EEE8] pt-1 pr-2 text-right text-[11px] text-tinta-3">
              {`${hour.toString().padStart(2, "0")}:00`}
            </div>

            <div
              className={`relative h-20 border-t border-l border-[#F1EEE8] border-l-filete p-2 ${
                isToday ? "bg-[#F7FBFB]" : "bg-white"
              }`}
            >
              {dayEvents
                .filter((event) => {
                  const start = horarioDaAgenda(event.start_time)
                  return (
                    getHours(start) === hour && isSameDay(start, currentDay)
                  )
                })
                .map((event, idx) => {
                  const start = horarioDaAgenda(event.start_time)
                  const end = horarioDaAgenda(event.end_time)
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
                          start_hour={format(start, "HH:mm")}
                          end_hour={format(end, "HH:mm")}
                          status={event.status}
                          variant={event.type}
                        />
                      </div>
                    </div>
                  )
                })}

              {isToday && hour === new Date().getHours() && (
                <div
                  className="absolute right-0 left-0 z-20 border-t-2 border-acao"
                  style={{
                    top: `${(new Date().getMinutes() / 60) * 100}%`,
                  }}
                >
                  <div className="-mt-[5px] -ml-1 h-2 w-2 rounded-full bg-acao"></div>
                </div>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 flex flex-col overflow-hidden rounded-[14px] border border-filete bg-white">
      {renderHeader()}
      <div className="flex">
        <div className="min-w-0 flex-1">
          <div ref={grade} className="max-h-[720px] overflow-y-auto">
            {renderHourRows()}
          </div>
        </div>
        {eventId ? <EventDetail /> : null}
      </div>
    </div>
  )
}

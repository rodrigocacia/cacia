"use client"

import React, { useEffect, useRef } from "react"

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
  getHours,
  getMinutes,
  set,
} from "date-fns"

import { ptBR } from "date-fns/locale"

import { Event } from "@/types/event"
import { useCalendarStore } from "@/stores/use-calendar-store"
import CardCalendar from "../card-calendar"

import { EventDetail } from "./event-detail"
import { horarioDaAgenda } from "@/utils/horario-da-agenda"
import { CabecalhoDaGrade } from "./cabecalho-da-grade"

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

  // A grade tem as 24 horas; abre no começo do expediente (7h, 80 px por
  // hora) em vez da madrugada.
  const grade = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (grade.current) grade.current.scrollTop = 7 * 80
  }, [])

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
    const weekEnd = addDays(weekStart, 6)

    return (
      <CabecalhoDaGrade
        titulo={`${format(weekStart, "d", { locale: ptBR })}–${format(
          weekEnd,
          "d 'de' MMMM 'de' yyyy",
          { locale: ptBR }
        )}`}
        aoNavegar={handleNavigation}
      />
    )
  }

  const renderDaysHeader = () => {
    const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
    return (
      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-filete bg-papel">
        <div />
        {days.map((day, idx) => {
          const hoje = isSameDay(day, today)
          return (
            <div
              key={idx}
              className="flex items-center gap-2 border-l border-filete px-2.5 py-2"
            >
              <span className="rotulo">{weekDays[idx]}</span>
              <span
                className={`tabular flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-[13px] ${
                  hoje ? "bg-acao font-semibold text-white" : "text-tinta-2"
                }`}
              >
                {format(day, "d")}
              </span>
            </div>
          )
        })}
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
      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
        {hours.map((hour, hourIdx) => (
          <React.Fragment key={hourIdx}>
            <div className="tabular h-full border-t border-[#F1EEE8] pt-1 pr-2 text-right text-[11px] text-tinta-3">
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
                const start = horarioDaAgenda(event.start_time)
                return isWithinInterval(start, { start: dayStart, end: dayEnd })
              })

              const eventsThisHour = dayEvents.filter((event) => {
                const start = horarioDaAgenda(event.start_time)
                return getHours(start) === hour && isSameDay(start, day)
              })

              return (
                <div
                  key={dayIdx}
                  className={`relative h-20 border-t border-l border-[#F1EEE8] border-l-filete p-1 ${
                    isToday ? "bg-[#F7FBFB]" : "bg-white"
                  }`}
                >
                  {eventsThisHour.map((event, idx) => {
                    const start = horarioDaAgenda(event.start_time)
                    const end = horarioDaAgenda(event.end_time)
                    const topOffset = (getMinutes(start) / 60) * 100

                    return (
                      <div
                        key={idx}
                        className="absolute left-0 right-0 z-10 cursor-pointer px-1"
                        style={{ top: `${topOffset}%`, minHeight: "2.5rem" }}
                        onClick={() => handleSelectEvent(event)}
                      >
                        <CardCalendar
                          title={event.title}
                          start_hour={format(start, "HH:mm")}
                          end_hour={format(end, "HH:mm")}
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
    <div className="mt-4 flex flex-col overflow-hidden rounded-[14px] border border-filete bg-white">
      {renderHeader()}
      <div className="flex">
        <div className="min-w-0 flex-1">
          {renderDaysHeader()}
          <div ref={grade} className="max-h-[680px] overflow-y-auto">
            {renderHourRows()}
          </div>
        </div>

        {eventId ? <EventDetail /> : null}
      </div>
    </div>
  )
}

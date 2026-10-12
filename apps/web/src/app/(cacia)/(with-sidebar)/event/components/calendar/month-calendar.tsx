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
  isToday,
} from "date-fns"

import { ptBR } from "date-fns/locale"

import { Event } from "@/types/event"

import { useCalendarStore } from "@/stores/use-calendar-store"

import CardCalendar from "../card-calendar"
import { EventDetail } from "./event-detail"
import { horarioDaAgenda } from "@/utils/horario-da-agenda"
import { CabecalhoDaGrade } from "./cabecalho-da-grade"

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

  // O título é o mês exibido. Usar o fim da semana de `currentMonth` (que é
  // o dia de hoje ao abrir) mostrava o mês seguinte nos últimos dias do mês.
  const renderHeader = () => (
    <CabecalhoDaGrade
      titulo={format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
      aoNavegar={handleNavigation}
    />
  )

  const renderDays = () => {
    const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
    return (
      <div className="grid grid-cols-7 border-b border-filete bg-papel">
        {weekDays.map((day, i) => (
          <div key={i} className="rotulo px-2.5 py-2">
            {day}
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
          start_time: format(horarioDaAgenda(event.start_time), "yyyy-MM-dd"),
          formatted_start_hour: format(
            horarioDaAgenda(event.start_time),
            "HH:mm"
          ),
          formatted_end_hour: format(horarioDaAgenda(event.end_time), "HH:mm"),
        }))

        const formattedDate = format(day, "yyyy-MM-dd")
        const isCurrentMonth = isSameMonth(day, monthStart)
        const dayEvents = eventsWithFormattedDate.filter(
          (event) => formattedDate === event.start_time
        )

        days.push(
          <div
            key={day.toString()}
            className={`flex min-h-[120px] min-w-0 flex-col gap-1 overflow-y-auto p-1.5 ${
              isCurrentMonth ? "bg-white" : "bg-papel"
            }`}
          >
            <div
              className={`tabular flex h-6 w-fit min-w-6 items-center justify-center rounded-md px-1 text-[12.5px] ${
                isToday(day)
                  ? "bg-acao font-semibold text-white"
                  : isCurrentMonth
                    ? "font-medium text-tinta-2"
                    : "text-gray-400"
              }`}
            >
              {format(day, "d")}
            </div>
            {dayEvents.map((event, idx) => (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectEvent(event)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSelectEvent(event)
                }}
              >
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
          className="grid grid-cols-7 gap-px border-b border-filete bg-filete last:border-b-0"
        >
          {days}
        </div>
      )
      days = []
    }

    return <>{rows}</>
  }

  return (
    <div className="mt-4 flex flex-col overflow-hidden rounded-[14px] border border-filete bg-white">
      {renderHeader()}
      <div className="flex">
        <div className="min-w-0 flex-1">
          {renderDays()}
          <div>{renderCells()}</div>
        </div>

        {eventId ? <EventDetail /> : null}
      </div>
    </div>
  )
}

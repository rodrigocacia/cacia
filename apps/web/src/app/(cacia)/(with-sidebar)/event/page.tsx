import { redirect } from "next/navigation"

import { getCalendar } from "@/http/calendar/get-calendar"
import { getEvent, GetEventResponse } from "@/http/event/get-event"

import { getDateRange } from "@/utils/get-date-range"

import { eventCrumbs } from "@/constants/breadcrumbs"

import { Breadcrumbs } from "@/components/ui/custom-breadcrumb"
import { Header } from "@/components/header"
import { CustomSearchFilter } from "@/components/ui/custom-search-filter"

import { SelectCalendar } from "./components/select-calendar"
import { CalendarMonth } from "./components/calendar-month"

import { NextEvents } from "./components/next-events"

import { Form } from "./new/form"
import { TabCalendarType } from "./components/tab-calendar-type"
import { ResponsiveCalendar } from "./components/calendar/responsive-calendar"
import { WeekCalendar } from "./components/calendar/weelky-calendar"
import { MonthCalendar } from "./components/calendar/month-calendar"
import { DayCalendar } from "./components/calendar/day-calendar"
import { DialogDeleteEvent } from "./components/dialog-delete-event"

export default async function EventPage({
  searchParams,
}: {
  searchParams: Promise<{
    calendar?: string
    tab?: string
    eventId?: string
    selectedDate?: string
    month?: string
  }>
}) {
  const { calendar, tab, eventId, selectedDate, month } = await searchParams

  const calendars = await getCalendar({ page: 1 })

  let events: GetEventResponse | null = null

  if (!calendar) {
    let query = "?calendar=all"

    if (eventId) {
      query += `&eventId=${eventId}`
    }

    redirect(query)
  }

  if (calendars.data.length > 0) {
    let referenceDate: Date | undefined = new Date()

    if (month) {
      const [year, monthPart] = month.split("-").map(Number)
      referenceDate = new Date(year, monthPart - 1, 1)
    }

    if (tab === "day" && selectedDate) {
      const [year, month, day] = selectedDate.split("-").map(Number)
      referenceDate = new Date(year, month - 1, day) // month é 0-indexed
    }

    events = await getEvent({
      page: 1,
      calendar_id: calendar === "all" ? "all" : String(calendar),
      start_time: getDateRange(tab ? String(tab) : "month", referenceDate)
        .start_time,
      end_time: getDateRange(tab ? String(tab) : "month", referenceDate)
        .end_time,
    })
  }

  return (
    <div className="w-full h-full">
      <div className="max-lg:px-4">
        <Header title="Eventos" />
      </div>

      <div className="flex items-start justify-between mt-7 max-lg:mt-2 max-lg:px-4">
        <div className="max-md:hidden">
          <Breadcrumbs crumbs={eventCrumbs} />
        </div>

        <div className="flex items-center gap-5 max-md:gap-0 max-md:w-full">
          <SelectCalendar calendars={calendars.data} />

          <div className="h-full bg-[#EFEFEF] py-2.5">
            <div className="w-[2px] h-full self-stretch bg-[#EFEFEF] max-md:hidden" />
          </div>

          <Form />
        </div>
      </div>

      <ResponsiveCalendar
        dataEvents={events?.data || []}
        searchParams={searchParams}
      />

      <div className="w-full grid grid-cols-[1fr_3fr] max-[1300px]:grid-cols-1 max-lg:px-4 gap-6 mt-7">
        <div className="h-full max-h-[calc(100vh-240px)] max-[1300px]:hidden bg-white rounded-2xl px-5 py-4 shadow-md">
          <CalendarMonth events={events?.data || []} />

          <hr className="w-full h-px mt-6 mb-6 border-t-0 bg-gray-200 max-lg:hidden" />

          <NextEvents searchParams={searchParams} />
        </div>

        <div className="w-full h-full flex flex-col max-md:hidden">
          <div className="w-full flex items-center justify-between">
            <CustomSearchFilter
              placeholder="Buscar..."
              className="max-w-[250px]"
            />

            <TabCalendarType />
          </div>

          <div className="w-full">
            {!tab && <MonthCalendar events={events?.data || []} />}

            {tab === "day" && <DayCalendar events={events?.data || []} />}

            {tab === "week" && <WeekCalendar events={events?.data || []} />}

            {tab === "month" && <MonthCalendar events={events?.data || []} />}

            {tab === "year" && <MonthCalendar events={events?.data || []} />}
          </div>
        </div>
      </div>

      <DialogDeleteEvent />
    </div>
  )
}

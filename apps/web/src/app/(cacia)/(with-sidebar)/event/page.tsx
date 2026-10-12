import { redirect } from "next/navigation"

import { getCalendar } from "@/http/calendar/get-calendar"
import { getEvent, GetEventResponse } from "@/http/event/get-event"

import { getDateRange } from "@/utils/get-date-range"

import { Header } from "@/components/header"
import { CustomSearchFilter } from "@/components/ui/custom-search-filter"
import { PageHeader } from "@/components/ui/page-header"

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
    <div className="h-full w-full">
      <div className="max-lg:px-4">
        <Header title="Agenda" />

        <PageHeader
          title="Agenda"
          description="Audiências, prazos e compromissos do escritório."
          action={
            <div className="flex items-center gap-2.5 max-md:w-full">
              <div className="min-w-[220px] max-md:w-full max-md:min-w-0">
                <SelectCalendar calendars={calendars.data} />
              </div>

              <Form />
            </div>
          }
        />
      </div>

      <div className="mt-6">
        <ResponsiveCalendar
          dataEvents={events?.data || []}
          searchParams={searchParams}
        />
      </div>

      <div className="grid w-full grid-cols-[300px_minmax(0,1fr)] gap-5 max-[1300px]:grid-cols-1 max-lg:px-4">
        <aside className="flex flex-col gap-5 max-[1300px]:hidden">
          <div className="rounded-[14px] border border-filete bg-white p-4">
            <CalendarMonth events={events?.data || []} />
          </div>

          <div className="overflow-hidden rounded-[14px] border border-filete bg-white">
            <NextEvents searchParams={searchParams} />
          </div>
        </aside>

        <div className="flex h-full w-full min-w-0 flex-col max-md:hidden">
          <div className="flex w-full items-center justify-between gap-3">
            <CustomSearchFilter placeholder="Buscar..." />

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

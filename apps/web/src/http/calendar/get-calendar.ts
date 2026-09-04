"use server"

import { api } from "../api-client"

import { Calendar } from "@/types/calendar"

export interface GetCalendarResponse {
  data: Calendar[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
}

export async function getCalendar({ page }: QueryParams) {
  const result = await api
    .get(`calendars?page=${page}`, {
      next: {
        tags: ["calendar"],
        revalidate: 60,
      },
    })
    .json<GetCalendarResponse>()

  return result
}

"use server"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"
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
  const officeId = await getCurrentOfficeId()

  const result = await api
    .get(`calendar?office_id=${officeId}&page=${page}`, {
      next: {
        tags: ["calendar"],
        revalidate: 60,
      },
    })
    .json<GetCalendarResponse>()

  return result
}

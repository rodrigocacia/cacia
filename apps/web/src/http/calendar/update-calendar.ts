/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"
import { api } from "../api-client"

import { AvailableDay } from "@/types/calendar"

interface UpdateCalendarRequest {
  calendarId: string
  title: string
  general_roles: string
  available_days: AvailableDay[]
}

interface UpdateCalendarResponse {
  _id: string
  office: string
  user: string
  title: string
  available_days: AvailableDay[]
  general_roles: string
  status: boolean
  deleted_at: null
  created_at: string
  updated_at: string
  __v: 0
}

export async function updateCalendar({
  calendarId,
  title,
  general_roles,
  available_days,
}: UpdateCalendarRequest) {
  try {
    const result = await api
      .patch(`calendars/${calendarId}`, {
        json: {
          title,
          general_roles,
          // Sem `user`: o responsável não muda na edição e a API recusa o campo
          available_days,
          general_available: "admin",
          cancel_roles: "admin",
          notification: true,
          status: true,
        },
      })
      .json<UpdateCalendarResponse>()

    revalidateTag("calendar")

    return { success: true, data: result }
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json()
      return {
        success: false,
        error: errorBody,
      }
    }

    return { success: false, error: "Erro interno no servidor" }
  }
}

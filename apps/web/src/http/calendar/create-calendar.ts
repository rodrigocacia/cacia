/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

import { AvailableDay } from "@/types/calendar"

export interface CreateCalendarRequest {
  title: string
  general_roles: string
  user: string
  available_days: AvailableDay[]
}

interface CreateCalendarResponse {
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

export async function createCalendar({
  title,
  general_roles,
  available_days,
}: CreateCalendarRequest) {
  // `user` continua na assinatura para não mexer em quem chama, mas não vai
  // mais no corpo: o dono da agenda é o usuário autenticado, e a API o resolve
  // pelo token. Aceitá-lo do cliente permitiria criar agenda em nome de outro.
  try {
    const result = await api
      .post("calendars", {
        json: {
          title,
          general_roles,
          available_days,
          general_available: "admin",
          cancel_roles: "admin",
          notification: true,
        },
      })
      .json<CreateCalendarResponse>()

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

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}

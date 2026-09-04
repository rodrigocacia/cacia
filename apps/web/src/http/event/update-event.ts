/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"
import { api } from "../api-client"

import { UserReminder } from "@/schemas/event"

interface UpdateEventRequest {
  eventId: string
  calendar_id: string
  process_id: string | null
  customer_id: string | null
  type: string
  description: string
  title: string
  start_time: string
  end_time: string
  status: string
  user_reminder?: UserReminder[]
  consultation_mode: string
}

interface UpdateEventResponse {
  office: string
  calendar: string
  process: string
  customer: string
  type: string
  title: string
  start_time: string
  end_time: string
  status: string
  deleted_at: null
  _id: string
  created_at: string
  updated_at: string
  __v: number
}

export async function updateEvent({
  eventId,
  calendar_id,
  process_id,
  customer_id,
  type,
  description,
  title,
  start_time,
  end_time,
  status,
  user_reminder,
  consultation_mode,
}: UpdateEventRequest) {
  try {
    const result = await api
      .patch(`events/${eventId}`, {
        json: {
          calendar_id,
          process_id,
          customer_id,
          type,
          description,
          title,
          start_time,
          end_time,
          status,
          // A API recebe apenas as antecedências, em minutos, e cria os
          // lembretes junto com o compromisso — daí o mapeamento.
          reminderOffsets: (user_reminder ?? []).map((r) => r.time_trigger),
          consultation_mode,
        },
      })
      .json<UpdateEventResponse>()

    revalidateTag("events")
    revalidateTag("reminders")

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

/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

import { UserReminder } from "@/schemas/event"

export interface CreateEventRequest {
  calendar_id: string
  customer_id: string | null
  lead_id?: string | null
  process_id: string | null
  type: string
  description: string
  title: string
  start_time: string
  end_time: string
  user_reminder?: UserReminder[]
  consultation_mode: "ONLINE" | "IN_PERSON"
}

interface CreateEventResponse {
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

export async function createEvent({
  calendar_id,
  customer_id,
  lead_id,
  process_id,
  type,
  title,
  description,
  start_time,
  end_time,
  user_reminder,
  consultation_mode,
}: CreateEventRequest) {
  try {
    const result = await api
      .post("events", {
        json: {
          calendar_id,
          // Vínculo vazio vai como ausente: a API valida o formato do id e
          // recusaria a string vazia. `status` não vai — o compromisso nasce
          // pendente e o DTO de criação não aceita o campo.
          customer_id: customer_id || undefined,
          lead_id: lead_id || undefined,
          process_id: process_id || undefined,
          type,
          title,
          description,
          start_time,
          end_time,
          // A API recebe apenas as antecedências, em minutos, e cria os
          // lembretes junto com o compromisso — daí o mapeamento.
          reminderOffsets: (user_reminder ?? []).map((r) => r.time_trigger),
          consultation_mode,
        },
      })
      .json<CreateEventResponse>()

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

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}

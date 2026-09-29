/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"
import { api } from "../api-client"

interface UpdateEventRequest {
  eventId: string
  type: string
  description: string
  title: string
  start_time: string
  end_time: string
  status?: string
  consultation_mode: "ONLINE" | "IN_PERSON"
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

/**
 * Edita o compromisso.
 *
 * Vai só o que o DTO de edição aceita: a API recusa campo desconhecido, e
 * agenda, cliente e processo não mudam depois de criado. Os lembretes também
 * ficam de fora — na edição, o seletor de notificações os grava direto, um a
 * um, pela rota de lembretes.
 */
export async function updateEvent({
  eventId,
  type,
  description,
  title,
  start_time,
  end_time,
  status,
  consultation_mode,
}: UpdateEventRequest) {
  try {
    const result = await api
      .patch(`events/${eventId}`, {
        json: {
          type,
          description,
          title,
          start_time,
          end_time,
          status,
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

"use server"

import { revalidateTag } from "next/cache"
import { api } from "../api-client"

export interface CreateReminderRequest {
  event: string
  customer?: string
  process?: string
  title: string
  description?: string
  time_trigger: number
  trigger_at: string
}

interface CreateReminderResponse {
  _id: string
  office: string
  user: string
  event: string
  lead?: string
  customer?: string
  process?: string
  type: string
  title: string
  description?: string
  time_trigger: number
  trigger_at: string
  status: string
  retry_count: number
  created_at: string
  updated_at: string
  __v: number
}

export async function createReminder({
  event,
  title,
  description,
  time_trigger,
}: CreateReminderRequest) {
  try {
    // `trigger_at` não vai mais: a API calcula o disparo a partir do início do
    // compromisso. Mandá-lo pronto permitiria um aviso desalinhado do evento a
    // que pertence. `customer` e `process` também saem — vêm do próprio evento.
    const result = await api
      .post("reminders", {
        json: {
          eventId: event,
          title,
          description,
          timeTrigger: time_trigger,
        },
      })
      .json<CreateReminderResponse>()

    revalidateTag("reminders")

    return { success: true, data: result }
  } catch (err: unknown) {
    if (err && typeof err === "object" && "response" in err) {
      const errorBody = await (
        err as { response: { json(): Promise<unknown> } }
      ).response.json()
      return {
        success: false,
        error: errorBody,
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}

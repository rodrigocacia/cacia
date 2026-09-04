"use server"

import { revalidateTag } from "next/cache"
import { api } from "../api-client"
import { getCurrentOfficeId } from "@/auth/auth"

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
  customer,
  process,
  title,
  description,
  time_trigger,
  trigger_at,
}: CreateReminderRequest) {
  try {
    const office_id = await getCurrentOfficeId()

    const result = await api
      .post("reminder", {
        json: {
          office: office_id,
          event,
          customer,
          process,
          type: "event",
          title,
          description,
          time_trigger,
          trigger_at,
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

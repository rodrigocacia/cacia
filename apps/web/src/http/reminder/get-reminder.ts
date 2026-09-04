"use server"

import { api } from "../api-client"
import { Reminder } from "@/types/reminder"

export async function getReminder(eventId: string) {
  try {
    const result = await api.get(`reminder/event/${eventId}`).json<Reminder[]>()

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

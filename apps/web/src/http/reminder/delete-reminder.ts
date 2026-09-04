"use server"

import { revalidateTag } from "next/cache"
import { api } from "../api-client"

export async function deleteReminder(reminderId: string) {
  try {
    await api.delete(`reminder/${reminderId}`)

    revalidateTag("reminders")

    return { success: true }
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

/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"
import { api } from "../api-client"

interface DeleteEventResponse {
  success: boolean
  data?: unknown
  error?: string
}

export async function deleteEvent(
  eventId: string
): Promise<DeleteEventResponse> {
  try {
    const response = await api.delete(`event/${eventId}`)
    const contentType = response.headers.get("content-type")

    let data: unknown = null

    if (contentType?.includes("application/json")) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    revalidateTag("events")

    return {
      success: true,
      data,
    }
  } catch (err: any) {
    if (err.response) {
      let errorBody

      try {
        errorBody = await err.response.json()
      } catch {
        errorBody = await err.response.text()
      }

      return {
        success: false,
        error:
          typeof errorBody === "string"
            ? errorBody
            : (errorBody?.message ?? "Erro na requisição"),
      }
    }

    return { success: false, error: "Erro interno no servidor" }
  }
}

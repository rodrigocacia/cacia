/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

export interface UpdateStatusNotificationRequest {
  notification_id: string
}

interface UpdateStatusNotificationResponse {
  _id: string
}

export async function updateStatusNotification({
  notification_id,
}: UpdateStatusNotificationRequest) {
  try {
    const result = await api
      .patch(`notifications/${notification_id}`, {
        json: {
          status: "open",
        },
      })
      .json<UpdateStatusNotificationResponse>()

    revalidateTag("notification")
    revalidateTag("notificationunread")

    return { success: true, data: result }
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json()
      return {
        success: false,
        error: errorBody.message ?? "Erro na requisição",
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}

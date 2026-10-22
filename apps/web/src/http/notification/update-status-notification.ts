/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { updateTag } from "next/cache"

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

    updateTag("notification")
    updateTag("notificationunread")

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

/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

export interface UpdateStatusNotificationForDeliveryRequest {
  notification_id: string
}

interface UpdateStatusNotificationForDeliveryResponse {
  _id: string
}

export async function updateStatusNotificationForDelivery({
  notification_id,
}: UpdateStatusNotificationForDeliveryRequest) {
  try {
    const office_id = await getCurrentOfficeId()

    const result = await api
      .patch(`notification/${notification_id}`, {
        json: {
          office_id,
          status: "delivery",
        },
      })
      .json<UpdateStatusNotificationForDeliveryResponse>()

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

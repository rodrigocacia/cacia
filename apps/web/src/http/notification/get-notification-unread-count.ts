"use server"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

export type GetNotificationUnreadCountResponse = number

export async function getNotificationUnreadCount() {
  const officeId = await getCurrentOfficeId()

  const queryParams = new URLSearchParams({
    office_id: officeId ?? "",
  })

  const result = await api
    .get(`notification/unread/count?${queryParams.toString()}`, {
      next: {
        tags: ["notificationunread"],
        revalidate: 60,
      },
    })
    .json<GetNotificationUnreadCountResponse>()

  return result
}

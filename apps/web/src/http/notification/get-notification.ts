"use server"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"
import { Notification } from "@/types/notification"

export interface GetNotificationResponse {
  data: Notification[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
  search?: string
  type?: string
}

export async function getNotification({ page, search, type }: QueryParams) {
  const officeId = await getCurrentOfficeId()

  const queryParams = new URLSearchParams({
    office_id: officeId ?? "",
    page: page.toString(),
  })

  if (search) {
    queryParams.set("number", search)
  }

  if (type) {
    queryParams.set("type", type)
  }

  const result = await api
    .get(`notification?${queryParams.toString()}`, {
      next: {
        tags: ["notification"],
        revalidate: 60,
      },
    })
    .json<GetNotificationResponse>()

  return result
}

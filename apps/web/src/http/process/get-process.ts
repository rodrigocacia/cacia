"use server"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"
import { Process } from "@/types/process"

export interface GetProcessResponse {
  data: Process[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
  search?: string
  customer_id?: string
  status?: string
}

export async function getProcess({
  page,
  search,
  status,
  customer_id,
}: QueryParams) {
  const officeId = await getCurrentOfficeId()

  const queryParams = new URLSearchParams({
    office_id: officeId ?? "",
    page: page.toString(),
  })

  if (search) {
    queryParams.set("number", search)
  }

  if (status) {
    queryParams.set("status", status)
  }

  if (customer_id) {
    queryParams.set("customer_id", customer_id)
  }

  const result = await api
    .get(`process?${queryParams.toString()}`, {
      next: {
        tags: ["process"],
        revalidate: 60,
      },
    })
    .json<GetProcessResponse>()

  return result
}

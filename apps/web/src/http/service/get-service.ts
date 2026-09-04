"use server"

import { Service } from "@/types/service"
import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

export interface GetServiceResponse {
  data: Service[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
  search?: string
  status?: string
}

export async function getService({ page, search, status }: QueryParams) {
  const officeId = await getCurrentOfficeId()

  const queryParams = new URLSearchParams({
    office_id: officeId ?? "",
    page: page.toString(),
  })

  if (status) {
    queryParams.set("status", status)
  }

  if (search) {
    queryParams.set("number", search)
  }

  const result = await api
    .get(`service?${queryParams.toString()}`, {
      next: {
        tags: ["service"],
        revalidate: 60,
      },
    })
    .json<GetServiceResponse>()

  return result
}

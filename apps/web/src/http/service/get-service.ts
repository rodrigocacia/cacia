"use server"

import { Service } from "@/types/service"
import { api } from "../api-client"

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
  const queryParams = new URLSearchParams({
    page: page.toString(),
  })

  if (status) {
    queryParams.set("status", status)
  }

  if (search) {
    queryParams.set("search", search)
  }

  const result = await api
    .get(`services?${queryParams.toString()}`, {
      next: {
        tags: ["service"],
        revalidate: 60,
      },
    })
    .json<GetServiceResponse>()

  return result
}

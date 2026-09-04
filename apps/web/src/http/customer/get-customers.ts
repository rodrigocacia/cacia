"use server"

import { api } from "../api-client"

import { Customer } from "@/types/customer"

export interface GetCustomersResponse {
  data: Customer[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
  search?: string
  limit?: number
  status?: string
}

export async function getCustomers({
  page,
  search,
  limit,
  status,
}: QueryParams) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
  })

  if (search) {
    queryParams.set("search", search)
  }

  if (limit) {
    queryParams.set("limit", limit.toString())
  }

  if (status) {
    queryParams.set("status", status)
  }

  const result = await api
    .get(`customers?${queryParams.toString()}`, {
      next: {
        tags: ["customers"],
        revalidate: 60,
      },
    })
    .json<GetCustomersResponse>()

  return result
}

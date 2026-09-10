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

/**
 * Cliente não tem status: o modelo tem nome, documento, contato e endereços,
 * e nada mais. O `status` daqui vinha do sistema antigo, não existe no DTO da
 * API e derrubava a listagem com 400 assim que alguém escolhia um filtro.
 */
interface QueryParams {
  page: number
  search?: string
  limit?: number
}

export async function getCustomers({ page, search, limit }: QueryParams) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
  })

  if (search) {
    queryParams.set("search", search)
  }

  if (limit) {
    queryParams.set("limit", limit.toString())
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

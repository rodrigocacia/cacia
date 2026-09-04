"use server"

import { api } from "../api-client"

import { Progress } from "@/types/progress"

export interface GetProgressResponse {
  data: Progress[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
  process_id: string
  search?: string
}

export async function getProgress({ page, process_id, search }: QueryParams) {
  // Os andamentos são sub-recurso do processo, não uma coleção própria: sem o
  // processo não há o que listar.
  const queryParams = new URLSearchParams({ page: page.toString() })

  if (search) {
    queryParams.set("search", search)
  }

  const result = await api
    .get(`processes/${process_id}/progresses?${queryParams.toString()}`, {
      next: {
        tags: [`progress/${process_id}`],
        revalidate: 60,
      },
    })
    .json<GetProgressResponse>()

  return result
}

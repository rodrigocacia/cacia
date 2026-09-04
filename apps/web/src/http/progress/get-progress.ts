"use server"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"
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
  const officeId = await getCurrentOfficeId()

  const queryParams = new URLSearchParams({
    office_id: officeId ?? "",
    page: page.toString(),
  })

  if (process_id) {
    queryParams.set("process_id", process_id)
  }

  if (search) {
    queryParams.set("number", search)
  }

  const result = await api
    .get(`progress?${queryParams.toString()}`, {
      next: {
        tags: ["progress"],
        revalidate: 60,
      },
    })
    .json<GetProgressResponse>()

  return result
}

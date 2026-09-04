"use server"

import { api } from "../api-client"

import { Setting } from "@/types/setting"

export interface GetSettingResponse {
  data: Setting[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
  search?: string
}

export async function getSetting({ page, search }: QueryParams) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
  })

  if (search) {
    queryParams.set("number", search)
  }

  const result = await api
    .get(`settings?${queryParams.toString()}`, {
      next: {
        tags: ["setting"],
        revalidate: 60,
      },
    })
    .json<GetSettingResponse>()

  return result
}

"use server"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"
import { Folder } from "@/types/folder"

export interface GetFoldersResponse {
  data: Folder[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
  search?: string
  sortBy?: string
}

export async function getFolders({ page, search, sortBy }: QueryParams) {
  const officeId = await getCurrentOfficeId()

  const queryParams = new URLSearchParams({
    office_id: officeId ?? "",
    page: page.toString(),
  })

  if (search) {
    queryParams.set("title", search)
  }

  if (sortBy) {
    queryParams.set("sort_by", sortBy)
  }

  const result = await api
    .get(`folder?${queryParams.toString()}`, {
      next: {
        tags: ["folders"],
        revalidate: 60,
      },
    })
    .json<GetFoldersResponse>()

  return result
}

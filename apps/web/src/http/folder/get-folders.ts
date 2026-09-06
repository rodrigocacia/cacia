"use server"

import { api } from "../api-client"

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
  const queryParams = new URLSearchParams({
    page: page.toString(),
  })

  // `search` e `sortBy`, não `title` e `sort_by`: a API rejeita o que não
  // reconhece, e a tela inteira voltava 400 ao carregar. O adaptador traduz o
  // corpo e a resposta, mas de propósito não mexe nos nomes da query.
  if (search) {
    queryParams.set("search", search)
  }

  if (sortBy) {
    queryParams.set("sortBy", sortBy)
  }

  const result = await api
    .get(`folders?${queryParams.toString()}`, {
      next: {
        tags: ["folders"],
        revalidate: 60,
      },
    })
    .json<GetFoldersResponse>()

  return result
}

"use server"

import { api } from "../api-client"

import { Question } from "@/types/question"

export interface GetQuestionResponse {
  data: Question[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
  search?: string
}

export async function getQuestion({ page, search }: QueryParams) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
  })

  if (search) {
    queryParams.set("number", search)
  }

  const result = await api
    .get(`questions?${queryParams.toString()}`, {
      next: {
        tags: ["question"],
        revalidate: 60,
      },
    })
    .json<GetQuestionResponse>()

  return result
}

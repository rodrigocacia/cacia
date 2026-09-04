/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

export interface UpdateQuestionRequest {
  question_id: string
  title: string
  description: string
}

interface UpdateQuestionResponse {
  office: string
  title: string
  description: string
  status: boolean
  deleted_at: string | null
  _id: string
  created_at: string
  updated_at: string
  __v: number
}

export async function updateQuestion({
  question_id,
  title,
  description,
}: UpdateQuestionRequest) {
  try {
    const result = await api
      .patch(`questions/${question_id}`, {
        json: {
          title,
          description,
          status: true,
        },
      })
      .json<UpdateQuestionResponse>()

    revalidateTag("question")

    return { success: true, data: result }
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json()
      return {
        success: false,
        error: errorBody.message ?? "Erro na requisição",
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}

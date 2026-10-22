/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { updateTag } from "next/cache"

import { api } from "../api-client"

export interface CreateQuestionRequest {
  title: string
  description: string
}

interface CreateQuestionResponse {
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

export async function createQuestion({
  title,
  description,
}: CreateQuestionRequest) {
  try {
    const result = await api
      .post("questions", {
        json: {
          title,
          description,
          status: true,
        },
      })
      .json<CreateQuestionResponse>()

    updateTag("question")

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

/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

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
    const office_id = await getCurrentOfficeId()

    const result = await api
      .post("question", {
        json: {
          office_id,
          title,
          description,
          status: true,
        },
      })
      .json<CreateQuestionResponse>()

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

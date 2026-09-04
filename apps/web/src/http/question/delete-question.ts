/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

import { Question as GetQuestionByIdResponse } from "@/types/question"

export async function deleteQuestion(questionId: string) {
  try {
    const result = await api
      .delete(`question/${questionId}`)
      .json<GetQuestionByIdResponse>()

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

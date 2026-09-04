import { Question as GetQuestionByIdResponse } from "@/types/question"
import { api } from "../api-client"

export async function getQuestionById(questionId: string) {
  const result = await api
    .get(`question/${questionId}`)
    .json<GetQuestionByIdResponse>()

  return result
}

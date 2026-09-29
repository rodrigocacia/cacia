import useSWR from "swr"

import { getQuestion, GetQuestionResponse } from "@/http/question/get-question"
import { getQuestionById } from "@/http/question/get-question-by-id"
import { Question } from "@/types/question"

export function useQuestion(page: number, search?: string) {
  const { data, error, isLoading, mutate } = useSWR<GetQuestionResponse>(
    ["question", page, search],
    () => getQuestion({ page, search })
  )

  return {
    questions: data?.data ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useQuestionById(questionId: string) {
  const { data, error, isLoading, mutate } = useSWR<Question>(
    questionId ? ["question", questionId] : null,
    () => getQuestionById(questionId)
  )

  return {
    question: data,
    isLoading,
    isError: !!error,
    mutate,
  }
}

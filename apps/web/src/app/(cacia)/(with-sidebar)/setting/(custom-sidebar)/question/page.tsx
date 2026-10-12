import { SWRConfig } from "swr"

import { getQuestion } from "@/http/question/get-question"

import { QuestionDetail } from "./detail"

export default async function QuestionPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}) {
  const { page, search } = await searchParams

  const question = await getQuestion({ search, page: Number(page) || 1 })

  return (
    <SWRConfig
      value={{
        fallback: {
          question: question,
        },
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false,
        refreshInterval: 0,
      }}
    >
      <QuestionDetail />
    </SWRConfig>
  )
}

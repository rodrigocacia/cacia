import useSWR from "swr"

import { getProgress, GetProgressResponse } from "@/http/progress/get-progress"

export function useProgress(page: number, process_id: string, search?: string) {
  const { data, error, isLoading, mutate } = useSWR<GetProgressResponse>(
    ["progress", page, process_id, search],
    () => getProgress({ page, process_id, search }),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    progress: data?.data ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  }
}

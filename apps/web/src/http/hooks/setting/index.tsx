import useSWR from "swr"

import { getSetting, GetSettingResponse } from "@/http/setting/get-setting"

export function useSetting(page: number, search?: string) {
  const { data, error, isLoading, mutate } = useSWR<GetSettingResponse>(
    ["setting", page, search],
    () => getSetting({ page, search })
  )

  return {
    settings: data?.data ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  }
}

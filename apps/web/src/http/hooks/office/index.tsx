import useSWR from "swr"

import {
  getOfficeById,
  GetOfficeByIdResponse,
} from "@/http/office/get-office-by-id"

export function useOfficeById() {
  const { data, error, isLoading, mutate } = useSWR<GetOfficeByIdResponse>(
    "office",
    () => getOfficeById()
  )

  return {
    office: data,
    isLoading,
    isError: !!error,
    mutate,
  }
}

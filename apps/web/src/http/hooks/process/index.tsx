import useSWR from "swr"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { getProcess, GetProcessResponse } from "@/http/process/get-process"
import { ProcessStatus } from "@/types/process"

export function useProcess(
  page: number,
  search?: string,
  status?: string,
  customer_id?: string
) {
  const { data, error, isLoading, mutate } = useSWR<GetProcessResponse>(
    ["processs", page, search, status, customer_id],
    () => getProcess({ search, status, page, customer_id })
  )

  const formattedData = data?.data.map((process) => ({
    ...process,
    status: process.status as ProcessStatus,
    updated_at: process.updated_at
      ? format(new Date(process.updated_at), "dd 'de' MMMM',' yyyy", {
          locale: ptBR,
        })
      : null,
  }))

  return {
    processs: formattedData ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  }
}

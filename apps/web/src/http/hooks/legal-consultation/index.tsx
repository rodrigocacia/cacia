/* eslint-disable @typescript-eslint/no-explicit-any */
import useSWR from "swr"

import { getLegalConsultation } from "@/http/legal-consultation/get-legal-consultation"

export function useLegalConsultation() {
  const { data, error, isLoading, mutate } = useSWR<any>(
    "legal-consultation",
    getLegalConsultation,
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
    }
  )

  return {
    data: data,
    isLoading,
    isError: !!error || (data && !data.success),
    mutate,
  }
}

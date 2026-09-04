/* eslint-disable @typescript-eslint/no-explicit-any */
import useSWR from "swr"

import { getSignature } from "@/http/plan/get-signature"

export function useSignature() {
  const { data, error, isLoading, mutate } = useSWR<any>(
    ["signature"],
    () => getSignature(),
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      dedupingInterval: 5000,
    }
  )

  return {
    signature: data,
    isLoading,
    isError: !!error,
    mutate,
  }
}

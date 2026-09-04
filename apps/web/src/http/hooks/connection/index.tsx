import useSWR from "swr"

import { getConnection } from "@/http/connection/get-connection"
import { Connection } from "@/types/connection"

export function useConnection() {
  const { data, error, isLoading, mutate } = useSWR<Connection>(
    "connection",
    () => getConnection(),
    {
      revalidateOnFocus: true,
      refreshInterval: 2000,
    }
  )

  return {
    connection: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  }
}

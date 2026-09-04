import useSWR from "swr"

import { me } from "@/http/user/me"
import { Me } from "@/types/me"

export function useMe() {
  const { data, error, isLoading, mutate } = useSWR<Me>("user", () => me())

  return {
    user: data,
    isLoading,
    isError: !!error,
    mutate,
  }
}

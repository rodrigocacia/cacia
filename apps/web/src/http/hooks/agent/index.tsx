import useSWR from "swr"

import { getAgents, GetAgentsResponse } from "@/http/agent/get-agent"

export function useAgents() {
  const { data, error, isLoading, mutate } = useSWR<GetAgentsResponse>(
    "agents",
    () => getAgents()
  )

  return {
    agents: data?.data ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  }
}

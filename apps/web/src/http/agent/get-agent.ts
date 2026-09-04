"use server"

import { api } from "../api-client"

import { Agent } from "@/types/agent"

export interface GetAgentsResponse {
  data: Agent[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

export async function getAgents() {
  const result = await api
    .get("agents", {
      next: {
        tags: ["agents"],
        revalidate: 60,
      },
    })
    .json<GetAgentsResponse>()

  return result
}

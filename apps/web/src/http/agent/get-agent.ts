"use server"

import { api } from "../api-client"

import { Agent } from "@/types/agent"

import { getCurrentOfficeId } from "@/auth/auth"

export interface GetAgentsResponse {
  data: Agent[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

export async function getAgents() {
  const officeId = await getCurrentOfficeId()

  const result = await api
    .get(`agent?office_id=${officeId}`, {
      next: {
        tags: ["agents"],
        revalidate: 60,
      },
    })
    .json<GetAgentsResponse>()

  return result
}

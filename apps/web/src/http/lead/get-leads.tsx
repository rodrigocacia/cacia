"use server"

import { Lead } from "@/types/lead"

import { api } from "../api-client"
import { getCurrentOfficeId } from "@/auth/auth"
import { isValidLeadStatus } from "@/types/lead-status"

export interface GetLeadsResponse {
  data: Lead[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
  search?: string
  status?: string
}

export async function getLeads({ page, search, status }: QueryParams) {
  const officeId = await getCurrentOfficeId()

  const queryParams = new URLSearchParams({
    office_id: officeId ?? "",
    page: page.toString(),
  })

  if (search) {
    queryParams.set("search", search)
  }

  if (status) {
    if (isValidLeadStatus(status)) {
      queryParams.set("status", status)
    }
  }

  const result = await api
    .get(`lead?${queryParams.toString()}`, {
      next: {
        tags: ["leads"],
        revalidate: 0,
      },
    })
    .json<GetLeadsResponse>()

  return result
}

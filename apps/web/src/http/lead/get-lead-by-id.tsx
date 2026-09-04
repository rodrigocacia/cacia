import { Lead as GetLeadByIdResponse } from "@/types/lead"
import { api } from "../api-client"

export async function getLeadById(leadId: string) {
  const result = await api.get(`leads/${leadId}`).json<GetLeadByIdResponse>()

  return result
}

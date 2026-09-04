import { Process as GetProcessByIdResponse } from "@/types/process"
import { api } from "../api-client"

export async function getProcessById(processId: string) {
  const result = await api
    .get(`processes/${processId}`)
    .json<GetProcessByIdResponse>()

  return result
}

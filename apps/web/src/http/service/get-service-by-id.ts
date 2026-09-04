import { Service as GetServiceByIdResponse } from "@/types/service"
import { api } from "../api-client"

export async function getServiceById(serviceId: string) {
  const result = await api
    .get(`services/${serviceId}`)
    .json<GetServiceByIdResponse>()

  return result
}

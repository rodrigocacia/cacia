import { Customer as GetCustomerByIdResponse } from "@/types/customer"
import { api } from "../api-client"

export async function getCustomerById(customerId: string) {
  const result = await api
    .get(`customers/${customerId}`)
    .json<GetCustomerByIdResponse>()

  return result
}

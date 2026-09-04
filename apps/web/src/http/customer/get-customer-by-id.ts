import { Customer as GetCustomerByIdResponse } from "@/types/customer"
import { api } from "../api-client"

export async function getCustomerById(customerId: string) {
  const result = await api
    .get(`customer/${customerId}`)
    .json<GetCustomerByIdResponse>()

  return result
}

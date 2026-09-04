"use server"

import { api } from "../api-client"
import { getCurrentOfficeId } from "@/auth/auth"

export interface GetOfficeByIdResponse {
  deleted_at: null
  _id: string
  user: string
  name: string
  description: string
  document: string
  oab_number: string
  legal_name: string
  trade_name: string
  remotejid: string
  address: [
    {
      city: string
      number: string
      state: string
      neighborhood: string
      street: string
      cep: string
      complement: string
    },
  ]
  status: string
  delete_at: null
  created_at: string
  updated_at: string
  __v: number
}

export async function getOfficeById() {
  const officeId = await getCurrentOfficeId()

  const result = await api
    .get(`office/${officeId}`)
    .json<GetOfficeByIdResponse>()

  return result
}

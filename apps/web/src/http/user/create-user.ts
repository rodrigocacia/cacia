/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "../api-client"

interface Address {
  street: string
  number: string
  cep: string
  city: string
  state: string
  neighborhood: string
  complement: string
}

export interface CreateUserRequest {
  user_name: string
  user_email: string
  user_password: string
  user_phone: string
  description: string
  document: string
  oab_number: string
  oab_uf: string
  legal_name: string
  trade_name: string
  name: string
  remotejid: string
  address?: Address
  plan: string
}

interface CreateUserResponse {
  office: string
  name: string
  remotejid: string
  email: string
  status: string
  last_activity_at: null
  delete_at: null
  _id: string
  events: []
  documents: []
  created_at: string
  updated_at: string
  __v: 0
}

export async function createUser({
  user_name,
  user_email,
  user_phone,
  user_password,
  description,
  document,
  oab_number,
  oab_uf,
  legal_name,
  name,
  trade_name,
  plan,
  remotejid,
  address,
}: CreateUserRequest) {
  try {
    const result = await api
      .post("offices", {
        json: {
          user_name,
          user_email,
          user_phone,
          user_password,
          description,
          document,
          oab_number,
          oab_uf,
          legal_name,
          name,
          trade_name,
          plan,
          remotejid,
          address,
        },
      })
      .json<CreateUserResponse>()

    return { success: true, data: result }
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json()
      return {
        success: false,
        error: errorBody,
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}

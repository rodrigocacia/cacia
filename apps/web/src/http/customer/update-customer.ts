/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

interface Address {
  street?: string
  number?: string
  cep?: string
  city?: string
  state?: string
  neighborhood?: string
}

export interface UpdateCustomerRequest {
  customer_id: string
  name: string
  remotejid: string
  document: string
  email?: string
  legal_name: string
  trade_name: string
  address?: Address[]
}

interface UpdateCustomerResponse {
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
}

export async function updateCustomer({
  customer_id,
  name,
  remotejid,
  document,
  email,
  legal_name,
  trade_name,
  address,
}: UpdateCustomerRequest) {
  try {
    const result = await api
      .patch(`customers/${customer_id}`, {
        json: {
          name,
          remotejid,
          document,
          ...(email && { email }),
          legal_name,
          trade_name,
          ...(address && address.length > 0 && { addresses: address }),
        },
      })
      .json<UpdateCustomerResponse>()

    revalidateTag("customers")

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

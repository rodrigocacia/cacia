/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

interface Address {
  street?: string
  number?: string
  cep?: string
  city?: string
  state?: string
  neighborhood?: string
  complement?: string
}

export interface CreateCustomerRequest {
  name: string
  remotejid: string
  document: string
  email?: string
  legal_name: string
  trade_name: string
  address?: Address[]
  lead_id?: string
}

interface CreateCustomerResponse {
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

export async function createCustomer({
  name,
  remotejid,
  document,
  email,
  legal_name,
  trade_name,
  address,
  lead_id,
}: CreateCustomerRequest) {
  try {
    const office_id = await getCurrentOfficeId()

    const result = await api
      .post("customer", {
        json: {
          office_id,
          name,
          remotejid,
          document,
          ...(email && { email }),
          legal_name,
          trade_name,
          ...(address && address.length > 0 && { address }),
          ...(lead_id && { lead_id }),
        },
      })
      .json<CreateCustomerResponse>()

    revalidateTag("customers")
    revalidateTag("leads")

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

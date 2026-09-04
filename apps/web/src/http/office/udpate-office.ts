/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

export interface UpdateOfficeRequest {
  name?: string
  trade_name?: string
  description?: string
  onboarding?: boolean
  address?: [
    {
      street: string
      number: string
      cep: string
      city: string
      state: string
      neighborhood: string
      complement?: string
    },
  ]
}

interface UpdateOfficeResponse {
  name: string
  description: string
  document: string
  user_name: string
  user_phone: string
  user_email: string
  user_password: string
  remotejid: string
  address: [
    {
      street: string
      number: string
      cep: string
      city: string
      state: string
      neighborhood: string
      complement: string
    },
  ]
}

export async function updateOffice({
  name,
  trade_name,
  description,
  onboarding,
  address,
}: UpdateOfficeRequest) {
  try {
    const officeId = await getCurrentOfficeId()

    const requestBody: any = {
      office_id: officeId,
    }

    if (name) requestBody.name = name
    if (trade_name) requestBody.trade_name = trade_name
    if (description) requestBody.description = description
    if (onboarding) requestBody.onboarding = onboarding
    if (address) requestBody.address = address

    const result = await api
      .patch(`office/${officeId}`, {
        json: requestBody,
      })
      .json<UpdateOfficeResponse>()

    revalidateTag(`office/${officeId}`)

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

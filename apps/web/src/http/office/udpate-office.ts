/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { updateTag } from "next/cache"

import { api } from "../api-client"

export interface UpdateOfficeRequest {
  name?: string
  legal_name?: string
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
  legal_name,
  trade_name,
  description,
  onboarding,
  address,
}: UpdateOfficeRequest) {
  try {
    const requestBody: Record<string, unknown> = {}

    if (name) requestBody.name = name
    if (legal_name) requestBody.legal_name = legal_name
    if (trade_name) requestBody.trade_name = trade_name
    if (description) requestBody.description = description
    if (address) requestBody.addresses = address

    // `!== undefined` e não `if (onboarding)`: concluir o onboarding envia
    // `true`, mas reabri-lo envia `false` — que a checagem por veracidade
    // descartava silenciosamente.
    if (onboarding !== undefined) requestBody.onboarding = onboarding

    const result = await api
      .patch("offices/current", {
        json: requestBody,
      })
      .json<UpdateOfficeResponse>()

    updateTag("office")

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

/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

export interface UpdateAgentRequest {
  agentId: string
  style: string
  greeting: string
  whatsapp_connection: string
  whatsapp_api_key: string
}

interface UpdateAgentResponse {
  agentId: string
  style: string
  type: string
  greeting: string
  whatsapp_connection: string
  whatsapp_api_key: string
}

export async function updateAgent({
  agentId,
  greeting,
  style,
  whatsapp_api_key,
  whatsapp_connection,
}: UpdateAgentRequest) {
  try {
    const office_id = await getCurrentOfficeId()

    const result = await api
      .patch(`agent/${agentId}`, {
        json: {
          office_id,
          greeting,
          style,
          whatsapp_api_key,
          whatsapp_connection,
        },
      })
      .json<UpdateAgentResponse>()

    revalidateTag("agents")

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

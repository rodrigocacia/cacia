/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { updateTag } from "next/cache"

import { api } from "../api-client"
import { AgentStyle } from "@/types/agent"

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
}: UpdateAgentRequest) {
  try {
    // O estilo viaja pela CHAVE do enum. A interface guarda o rótulo em
    // português ("Claro e Objetivo"); a API valida contra
    // CLEAR_AND_OBJECTIVE. Mandar o rótulo devolve 400.
    //
    // As credenciais de WhatsApp saíram daqui: pertencem à conexão, não ao
    // agente — ver http/connection.
    const result = await api
      .patch(`agents/${agentId}`, {
        json: {
          greeting,
          style: chaveDoEstilo(style),
        },
      })
      .json<UpdateAgentResponse>()

    updateTag("agents")

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

/** Rótulo em português -> chave do enum, que é o que a API valida. */
function chaveDoEstilo(rotulo: string): string {
  const entrada = Object.entries(AgentStyle).find(
    ([, valor]) => valor === rotulo
  )

  // Se já vier como chave, segue direto
  return entrada?.[0] ?? rotulo
}

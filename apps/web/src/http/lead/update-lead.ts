/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { updateTag } from "next/cache"
import { api } from "../api-client"

interface UpdateLeadRequest {
  leadId: string
  name: string
  remotejid: string
  email: string
}

interface UpdateLeadResponse {
  office: string
  name: string
  remotejid: string
  email?: string
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

export async function updateLead({ leadId, name, email }: UpdateLeadRequest) {
  try {
    const result = await api
      .patch(`leads/${leadId}`, {
        // O telefone não vai: é a identidade do contato no WhatsApp, e a API
        // recusa a edição inteira (400) se ele vier no corpo.
        json: {
          name,
          ...(email && { email }),
        },
      })
      .json<UpdateLeadResponse>()

    updateTag("leads")

    return { success: true, data: result }
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json()
      return {
        success: false,
        error: errorBody,
      }
    }

    return { success: false, error: "Erro interno no servidor" }
  }
}

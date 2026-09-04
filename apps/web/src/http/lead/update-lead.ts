/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"
import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

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

export async function updateLead({
  leadId,
  name,
  email,
  remotejid,
}: UpdateLeadRequest) {
  try {
    const office_id = await getCurrentOfficeId()

    const result = await api
      .patch(`lead/${leadId}`, {
        json: {
          name,
          ...(email && { email }),
          remotejid,
          office_id,
        },
      })
      .json<UpdateLeadResponse>()

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

    return { success: false, error: "Erro interno no servidor" }
  }
}

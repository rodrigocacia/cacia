/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { updateTag } from "next/cache"

import { api } from "../api-client"

export interface UpdateProcessRequest {
  process_id: string
  customer_id: string
  number: string
  description: string
}

interface UpdateProcessResponse {
  office: string
  customer: string
  unit: string
  number: string
  description: string
  status: string
  documents: []
  events: []
  progress: []
  delete_at: null
  last_activity_at: null
  _id: string
}

export async function updateProcess({
  process_id,
  description,
}: UpdateProcessRequest) {
  try {
    const result = await api
      .patch(`processes/${process_id}`, {
        // Número e cliente não vão: identificam o processo (e o acompanhamento
        // na Judit), e a API recusa a edição inteira (400) se vierem no corpo.
        json: { description },
      })
      .json<UpdateProcessResponse>()

    updateTag("process")

    return { success: true, data: result }
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json()
      return {
        success: false,
        error: errorBody.message ?? "Erro na requisição",
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}

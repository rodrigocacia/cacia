/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { updateTag } from "next/cache"

import { api } from "../api-client"

export interface CreateProcessRequest {
  customer_id: string
  number: string
  description: string
}

interface CreateProcessResponse {
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
  created_at: string
  updated_at: string
  __v: number
}

export async function createProcess({
  customer_id,
  number,
  description,
}: CreateProcessRequest) {
  try {
    const result = await api
      .post("processes", {
        json: {
          customer_id,
          number,
          description,
        },
      })
      .json<CreateProcessResponse>()

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

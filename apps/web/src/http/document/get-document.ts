"use server"

import { api } from "../api-client"
import { Document } from "@/types/document"

interface HTTPError extends Error {
  response?: {
    json(): Promise<{ message?: string }>
  }
}

export async function getDocument(id: string) {
  try {
    const result = await api.get(`document/${id}`).json<Document>()

    return { success: true, data: result }
  } catch (err: unknown) {
    const httpError = err as HTTPError
    if (httpError.response) {
      const errorBody = await httpError.response.json()
      return {
        success: false,
        error: errorBody.message ?? "Erro na requisição",
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}

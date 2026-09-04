"use server"

import { api } from "../api-client"

interface HTTPError extends Error {
  response?: {
    json(): Promise<{ message?: string }>
  }
}

interface ErrorResponse {
  message?: string
}

export async function downloadDocument(documentId: string) {
  try {
    const response = await api.get(`document/${documentId}/pdf`)

    if (!response.ok) {
      const errorBody = (await response.json()) as ErrorResponse
      return {
        success: false,
        error: errorBody.message ?? "Erro ao gerar PDF",
      }
    }

    const blob = await response.blob()

    return {
      success: true,
      data: {
        blob,
        filename: `documento-${documentId}.pdf`,
      },
    }
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

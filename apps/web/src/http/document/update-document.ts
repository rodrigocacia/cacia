"use server"

import { revalidateTag } from "next/cache"
import { api } from "../api-client"
import { Document, DocumentStatus } from "@/types/document"

interface HTTPError extends Error {
  response?: {
    json(): Promise<{ message?: string }>
  }
}

interface ErrorResponse {
  message?: string
}

export interface UpdateDocumentRequest {
  _id: string
  title?: string
  status?: DocumentStatus
  content?: string
  customer_id?: string | null
  lead_id?: string | null
}

interface UpdateData {
  title?: string
  status?: DocumentStatus
  content?: string
  customer_id?: string | null
  lead_id?: string | null
}

export async function updateDocument({
  _id,
  title,
  status,
  content,
  customer_id,
  lead_id,
}: UpdateDocumentRequest) {
  if (!_id) {
    console.error("updateDocument HTTP - ID está vazio ou undefined:", _id)
    return { success: false, error: "ID do documento não fornecido" }
  }

  try {
    const updateData: UpdateData = {}

    if (title) updateData.title = title
    if (status) updateData.status = status
    if (content) updateData.content = content
    if (customer_id !== undefined) updateData.customer_id = customer_id
    if (lead_id !== undefined) updateData.lead_id = lead_id

    const result = await api
      .patch(`documents/${_id}`, {
        json: updateData,
      })
      .json<Document>()

    revalidateTag("documents")
    revalidateTag("folders")

    return { success: true, data: result }
  } catch (err: unknown) {
    console.error("updateDocument HTTP - Erro:", err)
    const httpError = err as HTTPError
    if (httpError.response) {
      const errorBody = (await httpError.response.json()) as ErrorResponse
      return {
        success: false,
        error: errorBody.message ?? "Erro na requisição",
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}

export async function approveDocument(id: string) {
  if (!id) {
    console.error("approveDocument HTTP - ID está vazio ou undefined:", id)
    return { success: false, error: "ID do documento não fornecido" }
  }

  try {
    const result = await api.patch(`documents/${id}`).json<Document>()

    revalidateTag("documents")

    return { success: true, data: result }
  } catch (err: unknown) {
    console.error("approveDocument HTTP - Erro:", err)
    const httpError = err as HTTPError
    if (httpError.response) {
      const errorBody = (await httpError.response.json()) as ErrorResponse
      return {
        success: false,
        error: errorBody.message ?? "Erro na requisição",
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}

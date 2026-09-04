/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

export interface CreateDocumentRequest {
  title: string
  folder_id?: string | null
  customer_id?: string
  process_id?: string
  file: File
}

interface CreateDocumentResponse {
  office: string
  type: string
  title: string
  extension: string
  content_url: string
  deleted_at: null
  _id: string
  created_at: string
  updated_at: string
  __v: number
}

export async function createDocument({
  title,
  folder_id,
  file,
  customer_id,
  process_id,
}: CreateDocumentRequest) {
  try {
    const formData = new FormData()

    formData.append("title", title)

    // FormData não passa pela tradução do cliente — só corpo JSON passa. Os
    // nomes vão em camelCase à mão, como a API espera.
    if (folder_id) {
      formData.append("folderId", folder_id)
    }

    formData.append("file", file)

    if (customer_id) {
      formData.append("customerId", customer_id)
    }

    if (process_id) {
      formData.append("processId", process_id)
    }

    const result = await api
      .post("documents", {
        body: formData,
      })
      .json<CreateDocumentResponse>()

    revalidateTag("documents")

    if (customer_id) {
      revalidateTag(`customer/${customer_id}`)
    }

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

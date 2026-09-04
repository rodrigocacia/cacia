/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

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
    const office_id = await getCurrentOfficeId()

    const formData = new FormData()

    formData.append("title", title)
    formData.append("office_id", office_id || "")

    if (folder_id) {
      formData.append("folder_id", folder_id)
    }

    formData.append("file", file)

    if (customer_id) {
      formData.append("customer_id", customer_id)
    }

    if (process_id) {
      formData.append("process_id", process_id)
    }

    const result = await api
      .post("document", {
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

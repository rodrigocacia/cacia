/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { updateTag } from "next/cache"
import { api } from "../api-client"

export async function deleteDocument(documentId: string) {
  try {
    const response = await api.delete(`documents/${documentId}`)
    const contentType = response.headers.get("content-type")

    let data: any = null

    if (contentType?.includes("application/json")) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    updateTag("documents")

    return {
      success: true,
      data,
    }
  } catch (err: any) {
    if (err.response) {
      let errorBody

      try {
        errorBody = await err.response.json()
      } catch {
        errorBody = await err.response.text()
      }

      return {
        success: false,
        error:
          typeof errorBody === "string"
            ? errorBody
            : (errorBody?.message ?? "Erro na requisição"),
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}

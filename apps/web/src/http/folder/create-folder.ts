/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { updateTag } from "next/cache"

import { api } from "../api-client"

export interface CreateFolderRequest {
  title: string
}

interface CreateFolderResponse {
  office: string
  title: string
  documents: []
  deleted_at: null
  _id: string
  created_at: string
  updated_at: string
  __v: number
}

export async function createFolder({ title }: CreateFolderRequest) {
  try {
    const result = await api
      .post("folders", {
        json: {
          title,
        },
      })
      .json<CreateFolderResponse>()

    updateTag("folders")

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

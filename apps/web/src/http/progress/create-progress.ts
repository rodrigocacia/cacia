/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { updateTag } from "next/cache"

import { api } from "../api-client"

export interface CreateProgressRequest {
  process_id: string
  title: string
  description: string
  release_at: string
}

interface CreateProgressResponse {
  office: string
  process: string
  title: string
  description: string
  deleted_at: null
  release_at: string
  _id: string
  created_at: string
  updated_at: string
  __v: number
}

export async function createProgress({
  title,
  process_id,
  description,
  release_at,
}: CreateProgressRequest) {
  try {
    const result = await api
      .post(`processes/${process_id}/progresses`, {
        json: { title, description, release_at },
      })
      .json<CreateProgressResponse>()

    updateTag(`progress/${process_id}`)
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

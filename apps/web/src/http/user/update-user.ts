/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

export interface UpdateUserRequest {
  name: string
  document: string
  phone: string
}

interface UpdateUserResponse {
  userId: string
  name: string
  email: string
  phone: string
  document: string
}

export async function updateUser({ name, document, phone }: UpdateUserRequest) {
  try {
    const result = await api
      .patch("users/me", {
        json: {
          name,
          document,
          phone,
        },
      })
      .json<UpdateUserResponse>()

    revalidateTag("user")

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

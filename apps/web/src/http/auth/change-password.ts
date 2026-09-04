"use server"

import { api } from "../api-client"

export interface ChangePasswordRequest {
  password: string
  newPassword: string
  confirmNewPassword: string
}

interface ChangePasswordResponse {
  message: string
}

export async function changePassword({
  password,
  newPassword,
  confirmNewPassword,
}: ChangePasswordRequest) {
  try {
    const result = await api
      .put("users/me/password", {
        json: {
          password,
          newPassword,
          confirmNewPassword,
        },
      })
      .json<ChangePasswordResponse>()

    return { success: true, data: result }
  } catch (err: unknown) {
    const httpError = err as {
      response?: { json(): Promise<{ message?: string }> }
    }
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

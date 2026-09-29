"use server"

import { HTTPError } from "ky"

import { api } from "../api-client"

import { mensagemDeErro } from "@/utils/error-handlers"

export interface ChangePasswordRequest {
  password: string
  newPassword: string
}

/**
 * Troca a senha de quem está logado.
 *
 * A API recebe `{ currentPassword, newPassword }`; a confirmação é conferida
 * no formulário e não viaja — campo a mais no corpo é recusado.
 */
export async function changePassword({
  password,
  newPassword,
}: ChangePasswordRequest) {
  try {
    await api.put("users/me/password", {
      json: { currentPassword: password, newPassword },
    })

    return { success: true as const }
  } catch (erro) {
    if (erro instanceof HTTPError) {
      const corpo: unknown = await erro.response.json().catch(() => null)
      return { success: false as const, error: mensagemDeErro(corpo) }
    }

    console.error("Erro inesperado:", erro)
    return { success: false as const, error: "Erro interno no servidor" }
  }
}

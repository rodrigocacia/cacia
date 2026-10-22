"use server"

import { updateTag } from "next/cache"
import { HTTPError } from "ky"

import { api } from "../api-client"

import { mensagemDeErro } from "@/utils/error-handlers"

/**
 * Cancela o compromisso sem apagá-lo.
 *
 * É rota própria, e não um PATCH de status, porque a API também cancela os
 * lembretes pendentes — avisar o cliente de uma audiência cancelada é pior do
 * que não avisar.
 */
export async function cancelEvent(eventId: string) {
  try {
    await api.post(`events/${eventId}/cancel`)

    updateTag("events")
    updateTag("reminders")

    return { success: true as const }
  } catch (erro) {
    if (erro instanceof HTTPError) {
      const corpo: unknown = await erro.response.json().catch(() => null)
      return { success: false as const, error: mensagemDeErro(corpo) }
    }

    return { success: false as const, error: "Erro interno no servidor" }
  }
}

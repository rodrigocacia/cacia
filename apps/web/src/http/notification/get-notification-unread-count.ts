"use server"

import { api } from "../api-client"

export type GetNotificationUnreadCountResponse = number

/**
 * Quantas notificações o usuário ainda não abriu.
 *
 * A API devolve `{ count }`; o sino do cabeçalho espera o número direto.
 */
export async function getNotificationUnreadCount() {
  const resultado = await api
    .get("notifications/unread-count", {
      next: {
        tags: ["notificationunread"],
        revalidate: 60,
      },
    })
    .json<{ count: number }>()

  return resultado.count as GetNotificationUnreadCountResponse
}

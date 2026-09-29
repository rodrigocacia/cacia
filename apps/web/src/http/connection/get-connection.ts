"use server"

import { api } from "../api-client"

import { Connection } from "@/types/connection"

export interface GetConnectionResponse {
  data: Connection[]
}

/**
 * A API nova devolve `provider` (WAHA | EVOLUTION | OFICIAL); os componentes
 * leem `whatsapp_connection` em minúsculas, herdado do sistema anterior.
 */
export async function normalizarConexao(
  bruta: (Connection & { provider?: string }) | undefined
): Promise<Connection | null> {
  if (!bruta) return null

  return {
    ...bruta,
    whatsapp_connection:
      bruta.whatsapp_connection ?? bruta.provider?.toLowerCase() ?? "",
  }
}

export async function getConnection() {
  const result = await api
    .get("connections", {
      next: {
        tags: ["connection"],
        revalidate: 10,
      },
    })
    .json<GetConnectionResponse>()

  return normalizarConexao(result?.data?.[0])
}

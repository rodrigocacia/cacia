"use server"

import { api } from "../api-client"
import { normalizarConexao } from "./get-connection"

import { Connection } from "@/types/connection"

/**
 * Cria a conexão WhatsApp do escritório.
 *
 * No sistema anterior a conexão nascia junto com o cadastro do escritório;
 * na API nova ela é criada aqui, sob demanda, e abre uma sessão WAHA (com
 * fallback para Evolution). Exige papel ADMIN no escritório.
 */
export async function createConnection() {
  const criada = await api
    .post("connections", {
      json: { fallbackEnabled: true },
    })
    .json<Connection & { provider?: string }>()

  return normalizarConexao(criada)
}

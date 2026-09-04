import { Connection } from "@/types/connection"

export function isConnectionWorking(connection: Connection | null | undefined) {
  if (!connection) return false
  if (connection.whatsapp_connection === "waha") {
    return connection.waha_state === "WORKING"
  }
  return connection.evolution_state === "open"
}

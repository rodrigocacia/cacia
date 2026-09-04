import { api } from "../api-client"
import { Connection } from "@/types/connection"

export interface SetConnectionProxyParams {
  connectionId: string
  state: string
  city?: string
}

export async function setConnectionProxy({
  connectionId,
  state,
  city,
}: SetConnectionProxyParams) {
  return api
    .post(`connection/${connectionId}/proxy`, {
      json: { state, city },
    })
    .json<Connection>()
}

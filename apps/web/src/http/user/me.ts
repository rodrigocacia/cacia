import { Me } from "@/types/me"
import { api } from "../api-client"

export async function me() {
  const result = await api.get("users/me").json<Me>()

  return result
}

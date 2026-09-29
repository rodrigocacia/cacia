import { Me } from "@/types/me"
import { api } from "../api-client"

export async function me() {
  const result = await api.get("users/me").json<Me & { id: string }>()

  // A API devolve `id`; as telas de agenda leem `userId`, o nome do sistema
  // anterior. Sem isto o responsável da agenda nunca fica selecionado.
  return { ...result, userId: result.userId ?? result.id }
}

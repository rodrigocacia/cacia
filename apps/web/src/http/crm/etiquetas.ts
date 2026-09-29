import { apiCrm } from "../api-crm"
import type { Etiqueta, Pagina } from "./tipos"

export function listarEtiquetas(parametros?: {
  search?: string
  limit?: number
}): Promise<Pagina<Etiqueta>> {
  const query = new URLSearchParams()

  if (parametros?.search) query.set("search", parametros.search)
  // A tela de seleção precisa de todas de uma vez; o teto da API é 100
  query.set("limit", String(parametros?.limit ?? 100))

  return apiCrm.get("tags", { searchParams: query }).json<Pagina<Etiqueta>>()
}

export function criarEtiqueta(dados: {
  name: string
  color?: string
}): Promise<Etiqueta> {
  return apiCrm.post("tags", { json: dados }).json<Etiqueta>()
}

export function atualizarEtiqueta(
  id: string,
  dados: { name?: string; color?: string }
): Promise<Etiqueta> {
  return apiCrm.patch(`tags/${id}`, { json: dados }).json<Etiqueta>()
}

export async function removerEtiqueta(id: string): Promise<void> {
  await apiCrm.delete(`tags/${id}`)
}

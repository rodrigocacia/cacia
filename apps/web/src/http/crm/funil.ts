import type { StageKind } from "@cacia/contracts"

import { apiCrm } from "../api-crm"
import type { Funil } from "./tipos"

export function listarFunis(): Promise<Funil[]> {
  return apiCrm.get("pipelines").json<Funil[]>()
}

export function detalharFunil(id: string): Promise<Funil> {
  return apiCrm.get(`pipelines/${id}`).json<Funil>()
}

export function criarFunil(dados: { name: string }): Promise<Funil> {
  return apiCrm.post("pipelines", { json: dados }).json<Funil>()
}

export function atualizarFunil(
  id: string,
  dados: { name?: string; isDefault?: boolean }
): Promise<Funil> {
  return apiCrm.patch(`pipelines/${id}`, { json: dados }).json<Funil>()
}

export async function removerFunil(id: string): Promise<void> {
  await apiCrm.delete(`pipelines/${id}`)
}

export function criarEtapa(
  pipelineId: string,
  dados: { name: string; color?: string; kind?: StageKind }
): Promise<unknown> {
  return apiCrm
    .post(`pipelines/${pipelineId}/stages`, { json: dados })
    .json<unknown>()
}

export function atualizarEtapa(
  stageId: string,
  dados: { name?: string; color?: string; kind?: StageKind }
): Promise<unknown> {
  return apiCrm
    .patch(`pipelines/stages/${stageId}`, { json: dados })
    .json<unknown>()
}

export async function removerEtapa(stageId: string): Promise<void> {
  await apiCrm.delete(`pipelines/stages/${stageId}`)
}

/**
 * Reordena mandando a lista COMPLETA de etapas, na ordem nova.
 *
 * A API recusa lista parcial: deixaria as demais com posição repetida, e duas
 * colunas na mesma posição têm ordem indefinida na tela.
 */
export function reordenarEtapas(
  pipelineId: string,
  stageIds: string[]
): Promise<Funil> {
  return apiCrm
    .put(`pipelines/${pipelineId}/stages/reorder`, { json: { stageIds } })
    .json<Funil>()
}

import { apiCrm } from "../api-crm"
import type { Lead, MetricasDoFunil, Quadro } from "./tipos"

export interface FiltrosDoQuadro {
  pipelineId?: string
  ownerId?: string
  tagIds?: string[]
  search?: string
  porEtapa?: number
}

function queryDoQuadro(filtros: FiltrosDoQuadro): URLSearchParams {
  const query = new URLSearchParams()

  if (filtros.pipelineId) query.set("pipelineId", filtros.pipelineId)
  if (filtros.ownerId) query.set("ownerId", filtros.ownerId)
  if (filtros.search) query.set("search", filtros.search)
  if (filtros.porEtapa) query.set("porEtapa", String(filtros.porEtapa))

  // Repetido, não separado por vírgula: é como o Express monta array, e é o
  // que o DTO da API normaliza.
  for (const tagId of filtros.tagIds ?? []) query.append("tagIds", tagId)

  return query
}

export function buscarQuadro(filtros: FiltrosDoQuadro = {}): Promise<Quadro> {
  return apiCrm
    .get("leads/board", { searchParams: queryDoQuadro(filtros) })
    .json<Quadro>()
}

export function buscarMetricas(parametros: {
  pipelineId?: string
  dias?: number
}): Promise<MetricasDoFunil> {
  const query = new URLSearchParams()

  if (parametros.pipelineId) query.set("pipelineId", parametros.pipelineId)
  if (parametros.dias) query.set("dias", String(parametros.dias))

  return apiCrm
    .get("leads/funnel-metrics", { searchParams: query })
    .json<MetricasDoFunil>()
}

export function detalharLead(id: string): Promise<Lead> {
  return apiCrm.get(`leads/${id}`).json<Lead>()
}

/**
 * Move o lead de etapa.
 *
 * `lostReason` é obrigatório quando a etapa de destino é de perda — a API
 * recusa sem ele, porque um funil que perde sem motivo registrado não ensina
 * nada.
 */
export function moverEtapa(
  leadId: string,
  stageId: string,
  lostReason?: string
): Promise<Lead> {
  return apiCrm
    .patch(`leads/${leadId}/stage`, {
      json: { stageId, ...(lostReason && { lostReason }) },
    })
    .json<Lead>()
}

export function definirResponsavel(
  leadId: string,
  ownerId: string | null
): Promise<Lead> {
  return apiCrm
    .patch(`leads/${leadId}/owner`, { json: { ownerId } })
    .json<Lead>()
}

/** Substitui o conjunto inteiro de etiquetas do lead. */
export function definirEtiquetas(
  leadId: string,
  tagIds: string[]
): Promise<Lead> {
  return apiCrm.put(`leads/${leadId}/tags`, { json: { tagIds } }).json<Lead>()
}

export function atualizarLead(
  leadId: string,
  dados: {
    name?: string
    email?: string
    briefing?: string
    value?: number
    sourceDetail?: string
    expectedCloseAt?: string
  }
): Promise<Lead> {
  return apiCrm.patch(`leads/${leadId}`, { json: dados }).json<Lead>()
}

import { apiCrm } from "../api-crm"
import type { Disponibilidade } from "./tipos"

/**
 * Horários livres de uma agenda num dia, já descontados os compromissos.
 *
 * A data é DIA no fuso do escritório, não instante: mandar
 * `2026-09-15T00:00:00Z` traria os horários do dia 14, porque em São Paulo
 * ainda são 21h do dia anterior.
 */
export function horariosLivres(parametros: {
  calendarId: string
  date: string
  duracaoMinutos?: number
}): Promise<Disponibilidade> {
  const query = new URLSearchParams({ date: parametros.date })

  if (parametros.duracaoMinutos) {
    query.set("duracaoMinutos", String(parametros.duracaoMinutos))
  }

  return apiCrm
    .get(`calendars/${parametros.calendarId}/availability`, {
      searchParams: query,
    })
    .json<Disponibilidade>()
}

export interface NovaAtividade {
  calendarId: string
  leadId?: string
  customerId?: string
  title: string
  description?: string
  type?: "CALL" | "FOLLOW_UP" | "MEETING" | "COMMITMENT"
  startTime: string
  endTime: string
  reminderOffsets?: number[]
  permitirConflito?: boolean
}

export function agendarAtividade(dados: NovaAtividade): Promise<{
  id: string
  title: string
  startTime: string
  endTime: string
}> {
  return apiCrm
    .post("events", { json: dados })
    .json<{ id: string; title: string; startTime: string; endTime: string }>()
}

export interface Atividade {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  startTime: string
  endTime: string
}

export function atividadesDoLead(leadId: string): Promise<{
  data: Atividade[]
}> {
  return apiCrm
    .get("events", { searchParams: { leadId, limit: "50" } })
    .json<{ data: Atividade[] }>()
}

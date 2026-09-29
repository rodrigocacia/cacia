import { formatUtcMinus3 } from "@/utils/format-time-utc-minus-3"
import { api } from "../api-client"

import { Event as GetEventByIdResponse } from "@/types/event"

export async function getEventById(eventId: string) {
  const result = await api.get(`events/${eventId}`).json<GetEventByIdResponse>()

  // O compromisso traz só o id da agenda. O título vem da própria agenda —
  // sem ele o detalhe mostrava "Agenda não definida" para todo compromisso.
  // Falhar aqui não pode derrubar o detalhe inteiro: sem título, segue sem.
  const agenda = result.calendar_id
    ? await api
        .get(`calendars/${result.calendar_id}`)
        .json<{ _id: string; title: string }>()
        .catch(() => null)
    : null

  return {
    ...result,
    calendar: agenda ? { _id: agenda._id, title: agenda.title } : undefined,
    custom_start_time: formatUtcMinus3(result.start_time),
    custom_end_time: formatUtcMinus3(result.end_time),
  }
}

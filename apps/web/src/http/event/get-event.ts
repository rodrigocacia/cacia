"use server"

import { api } from "../api-client"
import { Event } from "@/types/event"
import { formatUtcMinus3 } from "@/utils/format-time-utc-minus-3"

export interface GetEventResponse {
  data: Event[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
  calendar_id: string
  start_time?: string
  end_time?: string
  process_id?: string
  customer_id?: string
}

// Datas sem hora ("2026-10-12") chegavam à API como meia-noite UTC. Com
// `to` igual a `from`, a visão de dia pedia um intervalo vazio; na semana e
// no mês, o último dia ficava de fora. Aqui o dia vira o dia inteiro de
// Brasília (UTC−3 o ano todo — o Brasil não tem horário de verão).
const SO_DATA = /^\d{4}-\d{2}-\d{2}$/

function inicioDoDia(data: string): string {
  return SO_DATA.test(data) ? `${data}T00:00:00.000-03:00` : data
}

function fimDoDia(data: string): string {
  return SO_DATA.test(data) ? `${data}T23:59:59.999-03:00` : data
}

export async function getEvent({
  page,
  calendar_id,
  start_time,
  end_time,
  process_id,
  customer_id,
}: QueryParams) {
  // Os nomes aqui são os do DTO da API (`calendarId`, `from`, `to`,
  // `processId`, `customerId`), não os do sistema antigo em snake_case: a
  // validação recusa parâmetro que não reconhece e a tela inteira voltava 400.
  const queryParams = new URLSearchParams({
    page: page.toString(),
    calendarId: calendar_id,
  })

  if (calendar_id === "all") {
    queryParams.delete("calendarId")
  }

  if (start_time && end_time) {
    queryParams.set("from", inicioDoDia(start_time))
    queryParams.set("to", fimDoDia(end_time))
  }

  if (process_id) {
    queryParams.set("processId", process_id)
  }

  if (customer_id) {
    queryParams.set("customerId", customer_id)
  }

  queryParams.set("limit", "100")

  const result = await api
    .get(`events?${queryParams.toString()}`, {
      // "events" é a tag que criar, editar, cancelar e excluir invalidam; só
      // com a da agenda o card excluído continuava na tela até recarregar.
      next: { tags: ["events", `event/${calendar_id}`] },
    })
    .json<GetEventResponse>()

  const data: Event[] = result.data.map((ev) => {
    const startMs = new Date(ev.start_time).getTime() - 3 * 60 * 60 * 1000
    const endMs = new Date(ev.end_time).getTime() - 3 * 60 * 60 * 1000

    return {
      ...ev,
      start_time: new Date(startMs).toISOString(),
      end_time: new Date(endMs).toISOString(),
      custom_start_time: formatUtcMinus3(ev.start_time),
      custom_end_time: formatUtcMinus3(ev.end_time),
    }
  })

  return { ...result, data }
}

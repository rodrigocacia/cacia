import { api } from "../api-client"

import { ProcessStatus, ProcessType } from "@/types/process"

/**
 * Os números da tela inicial, no formato em que chegam DEPOIS do adaptador.
 *
 * O que estava declarado aqui era o contrato do sistema antigo — `processStatus`
 * e `lastProcesses` em camelCase, processos com `documents`, `events`,
 * `progress` e `__v`. Nada disso existe: o adaptador renomeia as chaves de topo
 * para snake_case e a API não devolve esses campos. O resultado era
 * `data.lastProcesses` indefinido e a tela inteira caindo em
 * "Cannot read properties of undefined (reading 'length')".
 *
 * Este arquivo é a fronteira: quem lê o painel lê o que está aqui.
 */
export interface DashboardData {
  summary: {
    chats: number
    leads: number
    customers: number
    processes: number
  }
  process_status: Array<{
    status: ProcessStatus
    total: number
  }>
  process_type: Array<{
    type: ProcessType
    total: number
  }>
  last_processes: Array<{
    _id: string
    number: string
    description: string | null
    status: ProcessStatus
    type: ProcessType | null
    last_activity_at: string | null
    created_at: string
    /** Processo pode existir sem cliente vinculado. */
    customer: {
      _id: string
      name: string
      document: string
    } | null
  }>
}

export async function getDashboardData(startDate?: string, endDate?: string) {
  const response = await api
    .get(`dashboard?from=${startDate ?? ""}&to=${endDate ?? ""}`, {
      next: {
        tags: ["dashboard"],
        revalidate: 60,
      },
    })
    .json<DashboardData>()
  return response
}

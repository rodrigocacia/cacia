"use server"

import { api } from "../api-client"

import { Setting } from "@/types/setting"

export interface GetSettingResponse {
  data: Setting[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

interface QueryParams {
  page: number
  search?: string
}

/** Como a configuração chega depois do adaptador (snake_case). */
type ConfiguracaoDaApi = Record<string, unknown> & {
  notify_client_new_event?: boolean
  notify_client_update_process?: boolean
  notify_lawyer_new_lead?: boolean
  notify_lawyer_new_mark_lead?: boolean
  notify_lawyer_new_mark_customer?: boolean
  notify_lawyer_new_event?: boolean
  notify_lawyer_update_process?: boolean
  notify_lawyer_update_system?: boolean
}

/**
 * Espelho, na volta, da tradução feita em `update-setting.ts`.
 *
 * A tela lê `n_w_*` e a API devolve `notify_*`: sem traduzir aqui, todo
 * interruptor aparecia desligado — e salvar a tela assim desligava de verdade
 * as notificações que estavam ligadas.
 */
function paraCamposDaTela(configuracao: ConfiguracaoDaApi): Setting {
  return {
    ...configuracao,
    n_w_c_new_event: configuracao.notify_client_new_event,
    n_w_c_update_process: configuracao.notify_client_update_process,
    n_w_a_new_lead: configuracao.notify_lawyer_new_lead,
    n_w_a_new_mark_lead: configuracao.notify_lawyer_new_mark_lead,
    n_w_a_new_mark_customer: configuracao.notify_lawyer_new_mark_customer,
    n_w_a_new_event: configuracao.notify_lawyer_new_event,
    n_w_a_update_process: configuracao.notify_lawyer_update_process,
    n_w_a_update_system: configuracao.notify_lawyer_update_system,
  } as unknown as Setting
}

export async function getSetting({ page, search }: QueryParams) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
  })

  if (search) {
    queryParams.set("search", search)
  }

  const result = await api
    .get(`settings?${queryParams.toString()}`, {
      next: {
        tags: ["setting"],
        revalidate: 60,
      },
    })
    .json<GetSettingResponse | ConfiguracaoDaApi>()

  // A API devolve a configuração do escritório — um registro só, não uma
  // página. As telas leem `settings[0]` e esperam a lista; sem embrulhar, a
  // lista vinha sempre vazia e a etapa de notificações girava para sempre.
  if ("data" in result && Array.isArray(result.data)) {
    return {
      ...(result as GetSettingResponse),
      data: (result.data as ConfiguracaoDaApi[]).map(paraCamposDaTela),
    }
  }

  return {
    data: [paraCamposDaTela(result as ConfiguracaoDaApi)],
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    perPage: 1,
  }
}

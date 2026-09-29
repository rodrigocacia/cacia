"use client"

import useSWR from "swr"

import { listarEtiquetas } from "@/http/crm/etiquetas"
import { listarFunis } from "@/http/crm/funil"
import {
  buscarMetricas,
  buscarQuadro,
  detalharLead,
  type FiltrosDoQuadro,
} from "@/http/crm/leads"
import { detalharImportacao } from "@/http/crm/importacao"
import { atividadesDoLead } from "@/http/crm/agenda"
import {
  buscarConsumoDeIa,
  type PeriodoDoConsumo,
} from "@/http/crm/consumo-de-ia"
import type { LeadImportStatus } from "@cacia/contracts"

/**
 * Os dados do CRM, via SWR.
 *
 * Todos com `revalidateOnFocus: false`, como o resto da aplicação: o quadro é
 * arrastável, e recarregar ao voltar o foco desfaria visualmente um cartão que
 * a pessoa acabou de mover enquanto a escrita ainda está no ar.
 */

const PADRAO = { revalidateOnFocus: false } as const

export function useFunis() {
  const { data, error, isLoading, mutate } = useSWR(
    "crm:funis",
    listarFunis,
    PADRAO
  )

  return {
    funis: data ?? [],
    funilPadrao: data?.find((f) => f.isDefault) ?? data?.[0] ?? null,
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useEtiquetas(busca?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ["crm:etiquetas", busca],
    () => listarEtiquetas({ search: busca }),
    PADRAO
  )

  return {
    etiquetas: data?.data ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useQuadro(filtros: FiltrosDoQuadro) {
  const { data, error, isLoading, mutate } = useSWR(
    [
      "crm:quadro",
      filtros.pipelineId,
      filtros.ownerId,
      filtros.search,
      // A chave precisa mudar quando o conjunto de etiquetas muda; o array em
      // si é recriado a cada render e não serve como chave.
      (filtros.tagIds ?? []).join(","),
    ],
    () => buscarQuadro(filtros),
    PADRAO
  )

  return {
    quadro: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useLead(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ["crm:lead", id] : null,
    () => detalharLead(id as string),
    PADRAO
  )

  return { lead: data ?? null, isLoading, isError: !!error, mutate }
}

export function useAtividadesDoLead(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ["crm:atividades", id] : null,
    () => atividadesDoLead(id as string),
    PADRAO
  )

  return {
    atividades: data?.data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useMetricasDoFunil(pipelineId?: string, dias = 30) {
  const { data, error, isLoading, mutate } = useSWR(
    ["crm:metricas", pipelineId, dias],
    () => buscarMetricas({ pipelineId, dias }),
    PADRAO
  )

  return { metricas: data ?? null, isLoading, isError: !!error, mutate }
}

export function useConsumoDeIa(periodo: PeriodoDoConsumo) {
  const { data, error, isLoading } = useSWR(
    ["crm:consumo-de-ia", periodo.de, periodo.ate],
    () => buscarConsumoDeIa(periodo),
    PADRAO
  )

  return { consumo: data ?? null, erro: error as unknown, isLoading }
}

/** Situações em que a importação ainda vai mudar sozinha. */
const EM_ANDAMENTO: LeadImportStatus[] = [
  "QUEUED",
  "RUNNING",
] as LeadImportStatus[]

/**
 * Acompanha uma importação.
 *
 * Enquanto ela está na fila ou rodando, recarrega a cada dois segundos: quem
 * confirmou está olhando a tela, e uma barra parada em zero até o fim parece
 * travada. Terminada, o intervalo cai a zero — sem isso a aba ficaria batendo
 * na API para sempre.
 */
export function useImportacao(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ["crm:importacao", id] : null,
    () => detalharImportacao(id as string),
    {
      ...PADRAO,
      refreshInterval: (atual) =>
        atual && EM_ANDAMENTO.includes(atual.status) ? 2000 : 0,
    }
  )

  return {
    importacao: data ?? null,
    isLoading,
    isError: !!error,
    mutate,
  }
}

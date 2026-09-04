import useSWR from "swr"

import { getLeads, GetLeadsResponse } from "@/http/lead/get-leads"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { LeadStatus } from "@/types/lead-status"

export function useLeads(page: number, search?: string, status?: string) {
  const { data, error, isLoading, mutate } = useSWR<GetLeadsResponse>(
    ["leads", page, search, status],
    () => getLeads({ page, search, status }),
    {
      revalidateOnFocus: false,
    }
  )

  const formattedData = data?.data.map((lead) => ({
    ...lead,
    status: lead.status as LeadStatus,
    updated_at: lead.updated_at
      ? format(new Date(lead.updated_at), "dd 'de' MMMM',' yyyy", {
          locale: ptBR,
        })
      : null,
  }))

  return {
    leads: formattedData ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  }
}

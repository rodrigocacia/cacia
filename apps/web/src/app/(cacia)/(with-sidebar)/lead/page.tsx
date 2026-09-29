import { Suspense } from "react"

import { Icon } from "@/components/icone"

import { Header } from "@/components/header"
import { LeadsTable } from "@/components/tables/leads-table"

import { Form } from "./new/form"

import { Form as FormCustomer } from "../customer/new/steps"

import { CustomSearchFilter } from "@/components/ui/custom-search-filter"
import { FiltersPanel } from "@/components/filters-panel"
import { SWRConfig } from "swr"
import { getLeads } from "@/http/lead/get-leads"
import { getLeadById } from "@/http/lead/get-lead-by-id"
import { leadFilters } from "@/constants/filters/lead"
import { FiltersTabResponsive } from "@/components/filters-tab-responsive"
import { AlternadorDeVisao } from "@/components/crm/alternador-de-visao"
import { PainelDoFunil } from "@/components/crm/painel-do-funil"
import { PageHeader } from "@/components/ui/page-header"
import { ListToolbar } from "@/components/ui/list-toolbar"

export default async function Lead({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    editLeadId?: string
    leadId?: string
    view?: string
  }>
}) {
  const { page, search, status, editLeadId, leadId, view } = await searchParams

  // O quadro busca os próprios dados no cliente: as colunas são as etapas do
  // funil, que a tabela não conhece. Sair cedo evita carregar a listagem
  // paginada que a visão de funil não usaria.
  const emFunil = view === "kanban"

  if (emFunil) {
    return (
      <div className="w-full max-lg:px-4">
        <Header />

        <div className="mt-2 max-md:hidden">
          <PageHeader
            icon={
              <Icon
                icon="mdi:leads-outline"
                className="h-5 w-5 text-[#348C98]"
              />
            }
            title="Leads"
            action={<Form lead={null} />}
          />
        </div>

        <div className="mt-5">
          <ListToolbar>
            <Suspense fallback="Carregando...">
              <CustomSearchFilter placeholder="Buscar por nome ou telefone..." />
            </Suspense>

            <Suspense fallback={null}>
              <AlternadorDeVisao />
            </Suspense>
          </ListToolbar>
        </div>

        <Suspense fallback="Carregando...">
          <PainelDoFunil />
        </Suspense>
      </div>
    )
  }

  let leads = null
  let hasError = false

  let leadById = null

  if (editLeadId) {
    leadById = await getLeadById(editLeadId)
  }

  if (leadId) {
    leadById = await getLeadById(leadId)
  }

  try {
    leads = await getLeads({ page: Number(page) || 1, search, status })
  } catch (err) {
    console.error("Erro ao buscar leads:", err)
    hasError = true
  }

  if (hasError || !leads) {
    return (
      <div className="w-full h-full max-md:px-4">
        <Header title="Leads" />

        <p className="text-red-500 font-semibold text-center mt-12">
          Ocorreu um erro ao carregar os leads. Tente novamente mais tarde.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-lg:px-4">
      <Header />

      <div className="mt-2 max-md:hidden">
        <PageHeader
          icon={
            <Icon icon="mdi:leads-outline" className="h-5 w-5 text-[#348C98]" />
          }
          title="Leads"
          count={leads?.totalItems}
          action={<Form lead={leadById} />}
        />

        <div className="sr-only">
          <FormCustomer hasTrigger={false} lead={leadById} />
        </div>
      </div>

      <div className="mt-5">
        <ListToolbar>
          <Suspense fallback="Carregando...">
            <CustomSearchFilter placeholder="Buscar por nome ou telefone..." />
          </Suspense>

          <FiltersPanel filters={leadFilters} />

          <Suspense fallback={null}>
            <AlternadorDeVisao />
          </Suspense>
        </ListToolbar>
      </div>

      <FiltersTabResponsive filters={leadFilters} />

      <SWRConfig
        value={{
          fallback: {
            leads: leads,
          },
          revalidateOnFocus: false,
          revalidateIfStale: true,
          revalidateOnReconnect: false,
          refreshInterval: 0,
        }}
      >
        <LeadsTable />
      </SWRConfig>

      <div className="md:hidden">
        <Form lead={leadById} />
      </div>

      <FormCustomer hasTrigger={false} lead={leadById} />
    </div>
  )
}

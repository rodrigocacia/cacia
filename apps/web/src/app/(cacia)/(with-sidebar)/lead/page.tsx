import { Suspense } from "react"

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
        <Header title="Leads" />

        <PageHeader
          title="Leads"
          description="Contatos em atendimento, do primeiro contato até virar cliente."
          action={<Form lead={null} />}
        />

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
      <div className="h-full w-full max-lg:px-4">
        <Header title="Leads" />

        <p className="mt-12 rounded-xl bg-[#FBEDEA] px-4 py-3 text-center text-sm text-[#A23B2A]">
          Ocorreu um erro ao carregar os leads. Tente novamente mais tarde.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-lg:px-4">
      <Header title="Leads" />

      <PageHeader
        title="Leads"
        count={leads?.totalItems}
        description="Contatos em atendimento, do primeiro contato até virar cliente."
        action={
          // Uma instância só de cada formulário: o `DrawerOrSheet` já troca o
          // painel lateral pela gaveta no celular. Com duas cópias, as duas
          // reagiam ao `editLeadId`/`createLead` da URL e abriam dois painéis
          // (e dois botões flutuantes no celular).
          <Form lead={leadById} />
        }
      />

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

      <FormCustomer hasTrigger={false} lead={leadById} />
    </div>
  )
}

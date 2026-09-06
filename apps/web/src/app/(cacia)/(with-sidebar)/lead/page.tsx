import { Suspense } from "react"

import { Icon } from "@/components/icone"

import { Header } from "@/components/header"
import { LeadsTable } from "@/components/tables/leads-table"
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb"

import { Form } from "./new/form"

import { Form as FormCustomer } from "../customer/new/steps"

import { CustomSearchFilter } from "@/components/ui/custom-search-filter"
import { DialogFilters } from "@/components/filter-dialog"
import { SWRConfig } from "swr"
import { getLeads } from "@/http/lead/get-leads"
import { leadCrumbs } from "@/constants/breadcrumbs"
import { getLeadById } from "@/http/lead/get-lead-by-id"
import { leadFilters } from "@/constants/filters/lead"
import { FiltersTabResponsive } from "@/components/filters-tab-responsive"

export default async function Lead({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    editLeadId?: string
    leadId?: string
  }>
}) {
  const { page, search, status, editLeadId, leadId } = await searchParams

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

        <Breadcrumbs crumbs={leadCrumbs} />

        <p className="text-red-500 font-semibold text-center mt-12">
          Ocorreu um erro ao carregar os leads. Tente novamente mais tarde.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-lg:px-4">
      <Header title="Leads" />

      <Breadcrumbs crumbs={leadCrumbs} />

      <div className="w-full flex items-start justify-between mt-8 max-md:hidden">
        <div className="flex gap-2">
          <Icon icon="mdi:leads-outline" className="text-[#BDBDBD] w-8 h-8" />

          <h3 className="text-[18px] text-[#3D3D3D] font-bold">Leads</h3>

          <div className="w-7 h-7 p-0 flex items-center justify-center bg-[#E0E6EB] rounded-full">
            <span className="text-base text-[#707070] font-bold">
              {leads?.totalItems}
            </span>
          </div>
        </div>

        <Form lead={leadById} />

        <div className="sr-only">
          <FormCustomer hasTrigger={false} lead={leadById} />
        </div>
      </div>

      <div className="flex max-lg:flex-col max-lg:items-start items-center gap-3 mt-6">
        <Suspense fallback="Carregando...">
          <CustomSearchFilter placeholder="Buscar por nome ou telefone..." />
        </Suspense>

        <DialogFilters filters={leadFilters} />
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

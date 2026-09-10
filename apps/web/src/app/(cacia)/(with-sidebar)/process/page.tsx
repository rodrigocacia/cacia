import { Suspense } from "react"

import { Icon } from "@/components/icone"

import { Header } from "@/components/header"
import { ProcessTable } from "@/components/tables/process-table"
import { Form } from "./new/form"
import { CustomSearchFilter } from "@/components/ui/custom-search-filter"
import { getProcess } from "@/http/process/get-process"
import { SWRConfig } from "swr"
import { getProcessById } from "@/http/process/get-process-by-id"
import { FiltersPanel } from "@/components/filters-panel"
import { processFilters } from "@/constants/filters/process"
import { FiltersTabResponsive } from "@/components/filters-tab-responsive"
import { PageHeader } from "@/components/ui/page-header"
import { ListToolbar } from "@/components/ui/list-toolbar"

export default async function Process({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    editId?: string
  }>
}) {
  const { page, search, status, editId } = await searchParams

  const process = await getProcess({ search, status, page: Number(page) || 1 })

  let processById = null

  if (editId) {
    processById = await getProcessById(editId)
  }

  return (
    <div className="w-full max-lg:px-4">
      <Header />

      <div className="mt-2 max-md:hidden">
        <PageHeader
          icon={
            <Icon
              icon="mdi:folder-text-outline"
              className="h-5 w-5 text-[#348C98]"
            />
          }
          title="Processos"
          count={process?.totalItems}
          action={<Form process={processById} />}
        />
      </div>

      <div className="mt-5">
        <ListToolbar>
          <Suspense fallback="Carregando...">
            <CustomSearchFilter placeholder="Buscar pelo número do processo..." />
          </Suspense>

          <FiltersPanel filters={processFilters} />
        </ListToolbar>
      </div>

      <FiltersTabResponsive filters={processFilters} />

      <SWRConfig
        value={{
          fallback: {
            process: process,
          },
          revalidateOnFocus: false,
          revalidateIfStale: true,
          revalidateOnReconnect: false,
          refreshInterval: 0,
        }}
      >
        <ProcessTable />
      </SWRConfig>

      <div className="md:hidden">
        <Form process={processById} customerContext={true} />
      </div>
    </div>
  )
}

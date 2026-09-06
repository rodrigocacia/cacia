import { Suspense } from "react"

import { Icon } from "@/components/icone"

import { Header } from "@/components/header"
import { ProcessTable } from "@/components/tables/process-table"
import { Form } from "./new/form"
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb"
import { CustomSearchFilter } from "@/components/ui/custom-search-filter"
import { getProcess } from "@/http/process/get-process"
import { SWRConfig } from "swr"
import { processCrumbs } from "@/constants/breadcrumbs"
import { getProcessById } from "@/http/process/get-process-by-id"
import { DialogFilters } from "@/components/filter-dialog"
import { processFilters } from "@/constants/filters/process"
import { FiltersTabResponsive } from "@/components/filters-tab-responsive"

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
      <Header title="Processos" />

      <Breadcrumbs crumbs={processCrumbs} />

      <div className="w-full flex items-start justify-between mt-8 max-md:hidden">
        <div className="flex gap-2">
          <Icon
            icon="mdi:folder-text-outline"
            className="text-[#BDBDBD] w-8 h-8"
          />

          <h3 className="text-[18px] text-[#3D3D3D] font-bold">Processos</h3>

          <div className="w-7 h-7 flex items-center justify-center bg-[#E0E6EB] rounded-full">
            <span className="text-base text-[#707070] font-bold">
              {process?.totalItems}
            </span>
          </div>
        </div>

        <Form process={processById} />
      </div>

      <div className="flex max-lg:flex-col max-lg:items-start items-center gap-3 mt-6">
        <Suspense fallback="Carregando...">
          <CustomSearchFilter placeholder="Buscar pelo número do processo..." />
        </Suspense>

        <DialogFilters filters={processFilters} />
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

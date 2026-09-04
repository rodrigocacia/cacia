"use client"
import { Suspense } from "react"
import { Icon } from "@iconify/react/dist/iconify.js"
import { SWRConfig } from "swr"
import { Form } from "./new/steps"
import { CustomersTable } from "@/components/tables/customers-table"
import { CustomSearchFilter } from "@/components/ui/custom-search-filter"
import { Customer } from "@/types/customer"
import { DialogFilters } from "@/components/filter-dialog"
import { customerFilters } from "@/constants/filters/customer"
import { FiltersTabResponsive } from "@/components/filters-tab-responsive"

interface ClientFormSectionProps {
  customerById: Customer | null
  customers: { totalItems: number }
}
export default function ClientFormSection({
  customerById,
  customers,
}: ClientFormSectionProps) {
  return (
    <>
      <div className="w-full flex items-center justify-between mt-8">
        <div className="flex gap-2 items-center">
          <Icon
            icon="mdi:account-group-outline"
            className="text-[#BDBDBD] w-8 h-8"
          />
          <h3 className="text-[18px] text-[#3D3D3D] font-bold">Clientes</h3>
          <div className="w-7 h-7 flex items-center justify-center bg-[#E0E6EB] rounded-full">
            <span className="text-base text-[#707070] font-bold">
              {customers?.totalItems}
            </span>
          </div>
        </div>
        <Form customer={customerById} hasTrigger={true} />
      </div>

      <div className="flex max-lg:flex-col max-lg:items-start items-center gap-3 mt-6">
        <Suspense fallback="Carregando...">
          <CustomSearchFilter placeholder="Buscar por nome ou telefone..." />
        </Suspense>

        <DialogFilters filters={customerFilters} />
      </div>

      <FiltersTabResponsive filters={customerFilters} />

      <SWRConfig
        value={{
          fallback: {
            customers: customers,
          },
          revalidateOnFocus: false,
          revalidateIfStale: true,
          revalidateOnReconnect: false,
          refreshInterval: 0,
        }}
      >
        <CustomersTable />
      </SWRConfig>
    </>
  )
}

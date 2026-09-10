"use client"
import { Suspense } from "react"
import { Icon } from "@/components/icone"
import { SWRConfig } from "swr"
import { Form } from "./new/steps"
import { CustomersTable } from "@/components/tables/customers-table"
import { CustomSearchFilter } from "@/components/ui/custom-search-filter"
import { Customer } from "@/types/customer"
import { PageHeader } from "@/components/ui/page-header"
import { ListToolbar } from "@/components/ui/list-toolbar"

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
      <div className="mt-2">
        <PageHeader
          icon={
            <Icon
              icon="mdi:account-group-outline"
              className="h-5 w-5 text-[#348C98]"
            />
          }
          title="Clientes"
          count={customers?.totalItems}
          action={<Form customer={customerById} hasTrigger={true} />}
        />
      </div>

      <div className="mt-5">
        <ListToolbar>
          <Suspense fallback="Carregando...">
            <CustomSearchFilter placeholder="Buscar por nome ou telefone..." />
          </Suspense>
        </ListToolbar>
      </div>

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

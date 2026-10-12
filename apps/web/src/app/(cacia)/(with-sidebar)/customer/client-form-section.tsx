"use client"
import { Suspense } from "react"
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
      <PageHeader
        title="Clientes"
        count={customers?.totalItems}
        description="Pessoas e empresas que o escritório já representa."
        action={<Form customer={customerById} hasTrigger={true} />}
      />

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

import { getCustomers } from "@/http/customer/get-customers"
import { getCustomerById } from "@/http/customer/get-customer-by-id"
import { Header } from "@/components/header"
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb"
import { DialogDeleteCustomer } from "./components/dialog-delete-customer"
import { customerCrumbs } from "@/constants/breadcrumbs"
import ClientFormSection from "./client-form-section"

export default async function Lead({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
    editId?: string
    status?: string
  }>
}) {
  const { page, search, editId, status } = await searchParams

  let customerById = null
  if (editId) {
    customerById = await getCustomerById(editId)
  }

  const customers = await getCustomers({
    page: Number(page) || 1,
    search,
    status,
  })

  return (
    <div className="w-full max-lg:px-4">
      <Header title="Clientes" />
      <Breadcrumbs crumbs={customerCrumbs} />

      <ClientFormSection customerById={customerById} customers={customers} />

      <DialogDeleteCustomer />
    </div>
  )
}

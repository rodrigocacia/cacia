import { getCustomers } from "@/http/customer/get-customers"
import { getCustomerById } from "@/http/customer/get-customer-by-id"
import { Header } from "@/components/header"
import { DialogDeleteCustomer } from "./components/dialog-delete-customer"
import ClientFormSection from "./client-form-section"

export default async function Lead({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
    editId?: string
  }>
}) {
  const { page, search, editId } = await searchParams

  let customerById = null
  if (editId) {
    customerById = await getCustomerById(editId)
  }

  const customers = await getCustomers({
    page: Number(page) || 1,
    search,
  })

  return (
    <div className="w-full max-lg:px-4">
      <Header />

      <ClientFormSection customerById={customerById} customers={customers} />

      <DialogDeleteCustomer />
    </div>
  )
}

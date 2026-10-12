import { getCustomerById } from "@/http/customer/get-customer-by-id"

import { CustomerDetail } from "./detail"

export default async function ProccessDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: customerId } = await params

  const customer = await getCustomerById(customerId)

  return (
    <CustomerDetail
      name={customer?.name ?? ""}
      document={customer?.document}
      email={customer?.email ?? ""}
      address={customer?.address?.[0] ?? null}
      phone={customer?.remotejid ?? ""}
    />
  )
}

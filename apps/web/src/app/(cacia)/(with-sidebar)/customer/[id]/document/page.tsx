import { DocumentDetail } from "./detail"
import { getCustomerById } from "@/http/customer/get-customer-by-id"
import { getDocuments } from "@/http/document/get-documents"

export default async function Document({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: customerId } = await params

  const [customer, documentos] = await Promise.all([
    getCustomerById(customerId),
    getDocuments({ customerId }),
  ])

  return <DocumentDetail customer={customer} documents={documentos} />
}

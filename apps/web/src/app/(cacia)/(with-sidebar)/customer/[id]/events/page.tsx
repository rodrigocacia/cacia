import { NextEventDetails } from "../../../event/components/next-event-details"
import { Form } from "../../../event/new/form"

export default async function CustomerEventsPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ calendar?: string }>
  params: Promise<{ id: string }>
}) {
  const { id: customerId } = await params

  return (
    <NextEventDetails
      searchParams={searchParams}
      customerId={customerId}
      context="customer"
      acao={<Form customerId={customerId} />}
    />
  )
}

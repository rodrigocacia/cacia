import { getProcessById } from "@/http/process/get-process-by-id"

import { NextEventDetails } from "../../../event/components/next-event-details"
import { Form } from "../../../event/new/form"

export default async function ProcessEventsPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ calendar?: string }>
  params: Promise<{ id: string }>
}) {
  const { id: processId } = await params

  const process = await getProcessById(processId)

  return (
    <NextEventDetails
      searchParams={searchParams}
      processId={processId}
      context="process"
      acao={<Form processId={processId} customerId={process?.customer?._id} />}
    />
  )
}

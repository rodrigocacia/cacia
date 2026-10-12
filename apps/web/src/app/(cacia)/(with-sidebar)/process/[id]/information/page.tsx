import { getProcessById } from "@/http/process/get-process-by-id"

import { ProcessDetail } from "./detail"

export default async function ProcessInformation({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: processId } = await params

  const process = await getProcessById(processId)

  return <ProcessDetail process={process} />
}

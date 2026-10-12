import { ProgressDetail } from "./detail"
import { getProcessById } from "@/http/process/get-process-by-id"

export default async function ProgressInformation({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: processId } = await params

  const process = await getProcessById(processId)

  return <ProgressDetail process={process} />
}

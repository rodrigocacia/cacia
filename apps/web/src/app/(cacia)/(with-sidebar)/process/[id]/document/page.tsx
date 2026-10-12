import { getProcessById } from "@/http/process/get-process-by-id"

import { DocumentDetail } from "./detail"
import { getDocuments } from "@/http/document/get-documents"

export default async function DocumentInformation({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: processId } = await params

  const [process, documentos] = await Promise.all([
    getProcessById(processId),
    getDocuments({ processId }),
  ])

  return <DocumentDetail process={process} documents={documentos} />
}

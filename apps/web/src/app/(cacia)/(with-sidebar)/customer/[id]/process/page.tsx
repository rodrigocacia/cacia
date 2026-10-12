import { Processes } from "./detail"
import { getProcess } from "@/http/process/get-process"

export default async function ProccessDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: customerId } = await params

  // O detalhe do cliente não embute os processos (só a contagem): a lista vem
  // da própria listagem de processos, filtrada pelo cliente.
  const processos = await getProcess({ page: 1, customer_id: customerId })

  return <Processes processes={processos?.data ?? []} customerId={customerId} />
}

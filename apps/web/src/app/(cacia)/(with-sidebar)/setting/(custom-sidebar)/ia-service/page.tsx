import { SWRConfig } from "swr"

import { getAgents } from "@/http/agent/get-agent"

import { Cartao } from "../../_ui/cartao"
import { ServiceDetail } from "./detail"

export default async function ProccessDetail() {
  const agents = await getAgents()

  const serviceAgent = agents?.data?.find((agent) => agent.type === "SUPPORT")

  if (!serviceAgent) {
    return (
      <Cartao titulo="Atendimento">
        <p className="text-[13.5px] text-tinta-3">
          Nenhum assistente encontrado.
        </p>
      </Cartao>
    )
  }

  return (
    <SWRConfig
      value={{
        fallback: {
          agents: agents,
        },
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false,
        refreshInterval: 0,
      }}
    >
      <ServiceDetail />
    </SWRConfig>
  )
}

import { SWRConfig } from "swr"

import { getService } from "@/http/service/get-service"

import ServiceDetail from "./detail"

export default async function ServicePage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}) {
  const { page, search } = await searchParams

  const service = await getService({ page: Number(page) || 1, search })

  return (
    <SWRConfig
      value={{
        fallback: {
          service: service,
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

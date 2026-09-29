import useSWR from "swr"

import { getService, GetServiceResponse } from "@/http/service/get-service"
import { getServiceById } from "@/http/service/get-service-by-id"
import { Service } from "@/types/service"

export function useService(page: number, search?: string) {
  const { data, error, isLoading, mutate } = useSWR<GetServiceResponse>(
    ["service", page, search],
    () => getService({ search, page })
  )

  return {
    services: data?.data ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useServiceById(serviceId: string) {
  const { data, error, isLoading, mutate } = useSWR<Service>(
    serviceId ? ["service", serviceId] : null,
    () => getServiceById(serviceId)
  )

  return {
    service: data,
    isLoading,
    isError: !!error,
    mutate,
  }
}

import useSWR from "swr"

import {
  getCustomers,
  GetCustomersResponse,
} from "@/http/customer/get-customers"
import { getCustomerById } from "@/http/customer/get-customer-by-id"
import { Customer } from "@/types/customer"

interface Params {
  page?: number
  search?: string
  limit?: number
}

export function useCustomers({ page = 1, search, limit }: Params) {
  const { data, error, isLoading, mutate } = useSWR<GetCustomersResponse>(
    ["customers", page, search, limit],
    () => getCustomers({ page, search, limit })
  )

  return {
    customers: data?.data ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useCustomerById(customerId: string) {
  const { data, error, isLoading, mutate } = useSWR<Customer>(
    customerId ? ["customer", customerId] : null,
    () => getCustomerById(customerId)
  )

  return {
    customer: data,
    isLoading,
    isError: !!error,
    mutate,
  }
}

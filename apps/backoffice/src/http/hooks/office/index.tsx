import useSWR from "swr";

import { GetOfficesResponse, getOffices } from "@/http/office/get-offices";

interface Params {
  page?: number;
  search?: string;
  limit?: number;
  signature_status?: string;
}

export function useOffices({
  page = 1,
  search,
  limit,
  signature_status,
}: Params) {
  const { data, error, isLoading, mutate } = useSWR<GetOfficesResponse>(
    ["office", page, search, limit, signature_status],
    () => getOffices({ page, search, limit, signature_status }),
  );

  return {
    offices: data?.data ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  };
}

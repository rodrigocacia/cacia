import useSWR from "swr";

import {
  GetRecurrencesResponse,
  getRecurrences,
} from "@/http/recurrence/get-recurrences";

interface Params {
  page?: number;
  search?: string;
  limit?: number;
  office_id?: string;
  user_id?: string;
  status?: string;
}

export function useRecurrences({
  page = 1,
  search,
  limit = 10,
  office_id,
  user_id,
  status,
}: Params) {
  const { data, error, isLoading, mutate } = useSWR<GetRecurrencesResponse>(
    ["recurrence", page, search, limit, office_id, user_id, status],
    () => getRecurrences({ page, search, limit, office_id, user_id, status }),
  );

  return {
    recurrences: data?.data ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  };
}

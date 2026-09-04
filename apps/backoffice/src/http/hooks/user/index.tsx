import useSWR from "swr";
import ky from "ky";

import { GetUsersResponse, getUsers } from "@/http/user/get-users";
import { User } from "@/types/user";

interface Params {
  page?: number;
  search?: string;
  limit?: number;
  role?: string;
}

export function useUsers({ page = 1, search, limit, role }: Params) {
  const { data, error, isLoading, mutate } = useSWR<GetUsersResponse>(
    ["user", page, search, limit, role],
    () => getUsers({ page, search, limit, role }),
  );

  return {
    users: data?.data ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useMe() {
  const { data, error, isLoading, mutate } = useSWR<User>(
    "user/me",
    async () => {
      const result = await ky.get("user/me").json<User>();
      return result;
    },
  );

  return {
    user: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

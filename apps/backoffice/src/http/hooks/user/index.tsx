import useSWR from "swr";

import { GetUsersResponse, getUsers } from "@/http/user/get-users";
import { getMe } from "@/http/user/get-me";
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
  // Pelo `getMe`, e não por `ky` direto: a chamada crua saía sem a URL da API,
  // sem o token e sem a tradução da resposta — batia no próprio domínio do
  // painel e devolvia 404.
  const { data, error, isLoading, mutate } = useSWR<User | undefined>(
    "users/me",
    async () => {
      const resultado = await getMe();

      if (!resultado.success) throw new Error(String(resultado.error));

      return resultado.data;
    },
  );

  return {
    user: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

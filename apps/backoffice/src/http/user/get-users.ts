'use server';

import { api } from '../api-client';

import { User } from '@/types/user';

export interface GetUsersResponse {
  data: User[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

interface QueryParams {
  page: number;
  search?: string;
  limit?: number;
  role?: string;
}

export async function getUsers({ page, search, limit, role }: QueryParams) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
  });

  if (search) {
    queryParams.set('search', search);
  }

  if (limit) {
    queryParams.set('limit', limit.toString());
  }

  // A API só aceita ADMIN e USER e responde 400 ao resto. Um link antigo com
  // `?role=admin` derrubava a tela inteira; valor desconhecido vira "todos".
  const papel = role?.toUpperCase();
  if (papel === 'ADMIN' || papel === 'USER') {
    queryParams.set('role', papel);
  }

  const result = await api
    .get(`admin/users?${queryParams.toString()}`, {
      next: {
        tags: ['users'],
        revalidate: 60,
      },
    })
    .json<GetUsersResponse>();

  return result;
}

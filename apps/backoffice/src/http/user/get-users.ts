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

  if (role && role !== '-') {
    queryParams.set('role', role);
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

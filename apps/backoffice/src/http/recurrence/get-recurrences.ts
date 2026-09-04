'use server';

import { api } from '../api-client';

import { Recurrence } from '@/types/recurrence';

export interface GetRecurrencesResponse {
  data: Recurrence[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

interface QueryParams {
  page?: number;
  search?: string;
  limit?: number;
  office_id?: string;
  user_id?: string;
  plan_id?: string;
  status?: string;
}

export async function getRecurrences({
  page = 1,
  search,
  limit = 10,
  office_id,
  user_id,
  plan_id,
  status,
}: QueryParams) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    queryParams.set('search', search);
  }

  if (office_id) {
    queryParams.set('office_id', office_id);
  }

  if (user_id) {
    queryParams.set('user_id', user_id);
  }

  if (plan_id) {
    queryParams.set('plan_id', plan_id);
  }

  if (status) {
    queryParams.set('status', status);
  }

  const result = await api
    .get(`recurrence?${queryParams.toString()}`, {
      next: {
        tags: ['recurrence'],
        revalidate: 60,
      },
    })
    .json<GetRecurrencesResponse>();

  return result;
}

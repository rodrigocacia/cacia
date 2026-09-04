'use server';

import { api } from '../api-client';

import { Office } from '@/types/office';

export interface GetOfficesResponse {
  data: Office[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

interface QueryParams {
  page: number;
  search?: string;
  limit?: number;
  signature_status?: string;
}

export async function getOffices({
  page,
  search,
  limit,
  signature_status,
}: QueryParams) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
  });

  if (search) {
    queryParams.set('search', search);
  }

  if (limit) {
    queryParams.set('limit', limit.toString());
  }

  if (signature_status && signature_status !== '-') {
    queryParams.set('signature_status', signature_status);
  }

  const result = await api
    .get(`admin/offices?${queryParams.toString()}`, {
      next: {
        tags: ['offices'],
        revalidate: 60,
      },
    })
    .json<GetOfficesResponse>();

  return result;
}

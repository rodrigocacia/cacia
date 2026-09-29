'use server';

import { api } from '../api-client';

import { Office } from '@/types/office';
import { situacaoValida } from '@/constants/office-status';

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
  status?: string;
}

export async function getOffices({ page, search, limit, status }: QueryParams) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
  });

  if (search) {
    queryParams.set('search', search);
  }

  if (limit) {
    queryParams.set('limit', limit.toString());
  }

  // A API aceita `status` (PENDING/ACTIVE/DEACTIVATE) e responde 400 a
  // qualquer outro valor; o que não for reconhecido vira "todos".
  const situacao = situacaoValida(status);
  if (situacao) {
    queryParams.set('status', situacao);
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

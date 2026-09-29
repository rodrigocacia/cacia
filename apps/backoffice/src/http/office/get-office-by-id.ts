/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { Address } from '@/types/address';

import { api } from '../api-client';

export interface GetOfficeByIdRequest {
  id: string;
}

/** `GET /admin/offices/:id`, já traduzido pelo adaptador (snake_case). */
interface GetOfficeByIdResponse {
  _id: string;
  name: string;
  document: string;
  legal_name: string | null;
  trade_name: string | null;
  remotejid: string | null;
  description: string | null;
  oab_number: string;
  oab_uf: string;
  created_at: string;
  status: string;
  addresses: Address[];
  owner: { _id: string; name: string; email: string } | null;
}

export async function getOfficeById({ id }: GetOfficeByIdRequest) {
  try {
    const result = await api
      .get(`admin/offices/${id}`)
      .json<GetOfficeByIdResponse>();

    return { success: true, data: result };
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json();
      return {
        success: false,
        error: errorBody,
      };
    }

    console.error('Erro inesperado:', err);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

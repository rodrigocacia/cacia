/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { Address } from '@/types/address';

import { api } from '../api-client';

export interface GetOfficeByIdRequest {
  id: string;
}

interface GetOfficeByIdResponse {
  _id: string;
  name: string;
  document: string;
  legal_name: string;
  trade_name: string;
  remotejid: string;
  description: string;
  plan: string;
  created_at: string;
  status: string;
  signature_status: string;
  address: Address[];
}

export async function getOfficeById({ id }: GetOfficeByIdRequest) {
  try {
    const result = await api.get(`office/${id}`).json<GetOfficeByIdResponse>();

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

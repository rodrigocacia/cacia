/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';
import { revalidateTag } from 'next/cache';

export interface UpdateOfficeRequest {
  id: string;
  name: string;
  document: string;
  legal_name: string;
  trade_name: string;
  remotejid: string;
  description: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  }[];
}

interface UpdateOfficeResponse {
  _id: string;
  name: string;
  category: string;
  document: string;
  legal_name: string;
  trade_name: string;
  remotejid: string;
  description: string;
  plan: string;
  created_at: string;
  updated_at: string;
  __v: number;
}

export async function updateOffice({
  id,
  name,
  document,
  legal_name,
  trade_name,
  remotejid,
  description,
  address,
}: UpdateOfficeRequest) {
  try {
    const result = await api
      .patch(`admin/offices/${id}`, {
        json: {
          name,
          remotejid,
          document,
          legal_name,
          trade_name,
          description,
          address,
        },
      })
      .json<UpdateOfficeResponse>();

    revalidateTag('offices');

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

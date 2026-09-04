/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';
import { revalidateTag } from 'next/cache';

import { getCurrentOfficeId } from '@/auth/auth';

interface Address {
  street: string;
  number: string;
  cep: string;
  city: string;
  state: string;
  neighborhood: string;
}

export interface CreateOfficeRequest {
  name: string;
  document: string;
  legal_name: string;
  trade_name: string;
  remotejid: string;
  description: string;
  plan: string;
  address: Address[];
}

interface CreateOfficeResponse {
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

export async function createOffice({
  name,
  document,
  legal_name,
  trade_name,
  remotejid,
  description,
  plan,
  address,
}: CreateOfficeRequest) {
  try {
    const office_id = await getCurrentOfficeId();

    const result = await api
      .post(`office?office_id=${office_id}`, {
        json: {
          office_id,
          name,
          remotejid,
          document,
          legal_name,
          trade_name,
          address,
          description,
          plan,
        },
      })
      .json<CreateOfficeResponse>();

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

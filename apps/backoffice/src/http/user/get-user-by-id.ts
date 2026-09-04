/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';

export interface GetUserByIdRequest {
  id: string;
}

interface GetUserByIdResponse {
  _id: string;
  name: string;
  email: string;
  document: string;
  birthday: string;
  phone: string;
  created_at: string;
  offices: any[];
  subscriptions: any[];
  favorites: any[];
}

export async function getUserById({ id }: GetUserByIdRequest) {
  try {
    const result = await api.get(`user/${id}`).json<GetUserByIdResponse>();

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

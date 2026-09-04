/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';
import { User } from '@/types/user';

export interface UpdateMeRequest {
  name?: string;
  email?: string;
  document?: string;
  birthday?: string;
  phone?: string;
}

type UpdateMeResponse = User;

export async function updateMe(data: UpdateMeRequest) {
  try {
    const result = await api
      .patch('user', {
        json: data,
      })
      .json<UpdateMeResponse>();

    return { success: true, data: result };
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json();
      return {
        success: false,
        error: errorBody?.message || 'Erro ao atualizar dados',
      };
    }

    console.error('Erro inesperado:', err);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

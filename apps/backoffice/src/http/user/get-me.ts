/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';
import { User } from '@/types/user';

type GetMeResponse = User;

export async function getMe() {
  try {
    const result = await api.get('user/me').json<GetMeResponse>();

    return { success: true, data: result };
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json();
      return {
        success: false,
        error: errorBody?.message || 'Erro ao buscar dados do usuário',
      };
    }

    console.error('Erro inesperado:', err);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

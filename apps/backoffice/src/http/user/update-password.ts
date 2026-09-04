/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';

export interface UpdatePasswordRequest {
  password: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface UpdatePasswordResponse {
  message: string;
}

export async function updatePassword(data: UpdatePasswordRequest) {
  try {
    const result = await api
      .put('users/me/password', {
        json: data,
      })
      .json<UpdatePasswordResponse>();

    return { success: true, data: result };
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json();
      return {
        success: false,
        error: errorBody?.message || 'Erro ao atualizar senha',
      };
    }

    console.error('Erro inesperado:', err);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

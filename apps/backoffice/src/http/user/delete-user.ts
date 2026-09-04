/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';
import { revalidateTag } from 'next/cache';

export interface DeleteUserRequest {
  id: string;
}

export async function deleteUser({ id }: DeleteUserRequest) {
  try {
    await api.delete(`user/${id}`).json();

    revalidateTag('users');

    return { success: true };
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

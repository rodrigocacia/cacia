/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';
import { revalidateTag } from 'next/cache';

export interface DeleteOfficeRequest {
  id: string;
}

interface DeleteOfficeResponse {
  success: boolean;
  error?: any;
}

export async function deleteOffice({
  id,
}: DeleteOfficeRequest): Promise<DeleteOfficeResponse> {
  try {
    await api.delete(`admin/offices/${id}`).json();

    revalidateTag('offices');

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

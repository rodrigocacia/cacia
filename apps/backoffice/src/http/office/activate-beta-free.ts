/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { revalidateTag } from 'next/cache';
import { api } from '../api-client';

export interface ActivateBetaFreeRequest {
  id: string;
}

interface ActivateBetaFreeResponse {
  success: boolean;
  message: string;
}

export async function activateBetaFree({
  id,
}: ActivateBetaFreeRequest): Promise<ActivateBetaFreeResponse> {
  try {
    await api.post(`office/${id}/activate-beta-free`).json();

    revalidateTag('office');
    revalidateTag('recurrence');

    return { success: true, message: 'Plano Beta FREE ativado com sucesso!' };
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json();
      return {
        success: false,
        message: errorBody.message || 'Erro ao ativar plano Beta FREE',
      };
    }

    console.error('Erro inesperado:', err);
    return { success: false, message: 'Erro interno no servidor' };
  }
}

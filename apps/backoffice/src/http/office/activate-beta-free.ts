/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { updateTag } from 'next/cache';
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
    // A cobrança não foi reimplementada — não há plano a ativar. O que este
    // botão faz hoje é o efeito prático que se esperava dele: colocar o
    // escritório em atividade. Ver docs/ESTADO.md, "Cobrança".
    await api
      .patch(`admin/offices/${id}/status`, { json: { status: 'ACTIVE' } })
      .json();

    updateTag('office');
    updateTag('recurrence');

    return { success: true, message: 'Escritório ativado com sucesso!' };
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

'use server';

import { HTTPError } from 'ky';
import { updateTag } from 'next/cache';

import { OfficeStatus } from '@/types/office';

import { api } from '../api-client';
import { mensagemDeErro } from '../mensagem-de-erro';

/** Ativa ou desativa o escritório — `PATCH /admin/offices/:id/status`. */
export async function updateOfficeStatus({
  id,
  status,
}: {
  id: string;
  status: OfficeStatus;
}) {
  try {
    await api.patch(`admin/offices/${id}/status`, { json: { status } });

    updateTag('offices');

    return { success: true, error: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      const corpo: unknown = await err.response.json().catch(() => null);
      return {
        success: false,
        error: mensagemDeErro(corpo, 'Erro ao alterar a situação'),
      };
    }

    console.error('Erro inesperado:', err);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

'use server';

import { HTTPError } from 'ky';
import { updateTag } from 'next/cache';

import { api } from '../api-client';

/**
 * Edição do escritório pelo painel — `PATCH /admin/offices/:id`.
 *
 * O documento não vai: é a identidade do escritório e a API recusa o campo.
 * Os endereços substituem os atuais por inteiro, e lista vazia apaga todos.
 */
export interface UpdateOfficeRequest {
  id: string;
  name: string;
  legal_name: string;
  trade_name: string;
  remotejid: string;
  description: string;
  oab_number: string;
  oab_uf: string;
  addresses: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  }[];
}

export async function updateOffice({ id, ...dados }: UpdateOfficeRequest) {
  try {
    const result = await api
      .patch(`admin/offices/${id}`, { json: dados })
      .json<{ _id: string; name: string }>();

    updateTag('offices');

    return { success: true, data: result };
  } catch (err) {
    if (err instanceof HTTPError) {
      const errorBody: unknown = await err.response.json().catch(() => null);
      return { success: false, error: errorBody };
    }

    console.error('Erro inesperado:', err);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

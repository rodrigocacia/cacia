'use server';

import { HTTPError } from 'ky';

import { api } from '../api-client';
import { mensagemDeErro } from '../mensagem-de-erro';

/**
 * A tela pede a confirmação da nova senha, mas ela só serve para a própria
 * tela: a API recebe `{ currentPassword, newPassword }` e recusa campo a mais.
 */
export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function updatePassword(data: UpdatePasswordRequest) {
  try {
    // 204 sem corpo: nada a ler da resposta
    await api.put('users/me/password', { json: data });

    return { success: true };
  } catch (err) {
    if (err instanceof HTTPError) {
      const corpo: unknown = await err.response.json().catch(() => null);

      return {
        success: false,
        error: mensagemDeErro(corpo, 'Erro ao atualizar senha'),
      };
    }

    console.error('Erro inesperado:', err);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

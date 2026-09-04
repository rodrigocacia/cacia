/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';

export interface UpdateUserRequest {
  id: string;
  name: string;
  email: string;
  document: string;
  birthday: string;
  phone: string;
}

interface UpdateUserResponse {
  _id: string;
  name: string;
  email: string;
  document: string;
  birthday: string;
  phone: string;
}

export async function updateUser({
  id,
  name,
  email,
  document,
  birthday,
  phone,
}: UpdateUserRequest) {
  try {
    const result = await api
      .patch(`admin/users/${id}`, {
        json: {
          name,
          email,
          document,
          birthday,
          phone,
        },
      })
      .json<UpdateUserResponse>();

    return { success: true, data: result };
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

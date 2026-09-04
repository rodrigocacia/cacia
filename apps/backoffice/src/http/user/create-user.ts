/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  document: string;
  birthday: string;
  phone: string;
}

interface CreateUserResponse {
  _id: string;
  name: string;
  email: string;
  password: string;
  document: string;
  birthday: string;
  phone: string;
}

export async function createUser({
  name,
  email,
  password,
  document,
  birthday,
  phone,
}: CreateUserRequest) {
  try {
    const result = await api
      .post('admin/users', {
        json: {
          name,
          email,
          password,
          document,
          birthday,
          phone,
        },
      })
      .json<CreateUserResponse>();

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

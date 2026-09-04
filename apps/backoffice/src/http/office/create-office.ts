/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';
import { revalidateTag } from 'next/cache';

interface Address {
  street: string;
  number: string;
  cep: string;
  city: string;
  state: string;
  neighborhood: string;
}

export interface CreateOfficeRequest {
  name: string;
  document: string;
  legal_name: string;
  trade_name: string;
  remotejid: string;
  description: string;
  /**
   * Plano contratado — sem uso hoje.
   *
   * A cobrança não foi reimplementada e não há assinatura a vincular. Continua
   * no tipo, opcional, para não quebrar quem já passa o campo.
   */
  plan?: string;
  address: Address[];

  /** Registro na OAB — a API recusa o cadastro sem ele. */
  oab_number: string;
  oab_uf: string;

  /** O responsável, criado junto: escritório sem membro é inacessível. */
  owner_name: string;
  owner_email: string;
  owner_password: string;
  owner_phone?: string;
}

interface CreateOfficeResponse {
  _id: string;
  name: string;
  category: string;
  document: string;
  legal_name: string;
  trade_name: string;
  remotejid: string;
  description: string;
  plan: string;
  created_at: string;
  updated_at: string;
  __v: number;
}

export async function createOffice({
  name,
  document,
  legal_name,
  trade_name,
  remotejid,
  description,
  address,
  oab_number,
  oab_uf,
  owner_name,
  owner_email,
  owner_password,
  owner_phone,
}: CreateOfficeRequest) {
  try {
    // `plan` continua na assinatura para não mexer em quem chama, mas não é
    // enviado: a cobrança não foi reimplementada e não há assinatura a
    // vincular — ver docs/ESTADO.md.
    const result = await api
      .post('admin/offices', {
        json: {
          name,
          remotejid,
          document,
          legal_name,
          trade_name,
          description,
          oab_number,
          oab_uf,
          owner_name,
          owner_email,
          owner_password,
          owner_phone,
          addresses: address,
        },
      })
      .json<CreateOfficeResponse>();

    revalidateTag('offices');

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

'use server';

import { Recurrence } from '@/types/recurrence';

/**
 * Cobranças recorrentes — NÃO REIMPLEMENTADAS.
 *
 * O sistema anterior cobrava por PIX através da iopay, e esta listagem era a
 * tela financeira do painel. A reconstrução não trouxe a integração de
 * pagamento: não há gateway configurado, nem rota na API, nem decisão tomada
 * sobre qual provedor usar.
 *
 * Devolve uma página vazia em vez de chamar um endpoint inexistente. A
 * alternativa seria um 404 disfarçado de erro de rede, mais difícil de
 * diagnosticar do que uma tela vazia com o motivo escrito.
 *
 * Ver docs/ESTADO.md — "Cobrança".
 */

export interface GetRecurrencesResponse {
  data: Recurrence[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  /** Falso enquanto a cobrança não voltar. */
  disponivel: boolean;
}

interface QueryParams {
  page?: number;
  search?: string;
  limit?: number;
  office_id?: string;
  user_id?: string;
  plan_id?: string;
  status?: string;
}

export async function getRecurrences({
  page = 1,
  limit = 10,
}: QueryParams): Promise<GetRecurrencesResponse> {
  return {
    data: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: page,
    perPage: limit,
    disponivel: false,
  };
}

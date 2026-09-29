'use server';

import { HTTPError } from 'ky';

import { api } from '../api-client';
import { mensagemDeErro } from '../mensagem-de-erro';

export interface GetOfficePerformanceRequest {
  officeId: string;
  periodInDays: number;
}

/**
 * `GET /admin/offices/:id/performance`, já traduzido pelo adaptador — por
 * isso em snake_case. A variação compara o período pedido com o anterior, de
 * mesma duração.
 */
export interface GetOfficePerformanceResponse {
  period_in_days: number;
  customers: number;
  customers_variation: number;
  leads: number;
  leads_variation: number;
  documents: number;
  documents_variation: number;
  total_processes: number;
  completed_processes: number;
  ongoing_processes: number;
  /** Tipo de processo (`CIVIL`, `TRABALHISTA`...) → quantidade. */
  processes_by_type: Record<string, number>;
}

export async function getOfficePerformance({
  officeId,
  periodInDays,
}: GetOfficePerformanceRequest): Promise<
  | { success: true; data: GetOfficePerformanceResponse }
  | { success: false; error: string }
> {
  try {
    const result = await api
      .get(`admin/offices/${officeId}/performance?periodInDays=${periodInDays}`)
      .json<GetOfficePerformanceResponse>();

    return { success: true, data: result };
  } catch (err) {
    if (err instanceof HTTPError) {
      const corpo: unknown = await err.response.json().catch(() => null);
      return {
        success: false,
        error: mensagemDeErro(corpo, 'Erro ao carregar o desempenho'),
      };
    }

    console.error('Erro inesperado:', err);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

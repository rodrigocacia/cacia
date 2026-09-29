'use server';

import { HTTPError } from 'ky';

import { api } from '../api-client';
import { mensagemDeErro } from '../mensagem-de-erro';
import { queryDoIntervalo, type IntervaloDeConsumo } from '@/utils/consumo-ia';

export interface PeriodoDeConsumo {
  de: string;
  ate: string;
}

export interface ValoresDeConsumo {
  /** R$ pagos aos provedores de IA. */
  custo: number;
  /** R$ a cobrar do escritório: custo + margem. */
  cobrado: number;
}

/**
 * `GET /admin/ai-usage`, já traduzido pelo adaptador — por isso em
 * snake_case (`margem_percentual`, `office_id`, `sem_preco`).
 */
export interface GetAiUsageResponse {
  periodo: PeriodoDeConsumo;
  margem_percentual: number;
  total: ValoresDeConsumo;
  /** Já ordenados por custo, do maior para o menor. */
  escritorios: {
    office_id: string;
    nome: string;
    removido: boolean;
    chamadas: number;
    tokens: number;
    custo: number;
    cobrado: number;
    /** Alguma chamada usou modelo sem preço: o custo está subestimado. */
    sem_preco: boolean;
  }[];
}

export async function getAiUsage(
  intervalo: IntervaloDeConsumo,
): Promise<
  | { success: true; data: GetAiUsageResponse }
  | { success: false; error: string }
> {
  try {
    const result = await api
      .get(`admin/ai-usage${queryDoIntervalo(intervalo)}`)
      .json<GetAiUsageResponse>();

    return { success: true, data: result };
  } catch (err) {
    if (err instanceof HTTPError) {
      const corpo: unknown = await err.response.json().catch(() => null);
      return {
        success: false,
        error: mensagemDeErro(corpo, 'Erro ao carregar o consumo de IA'),
      };
    }

    console.error('Erro inesperado:', err);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

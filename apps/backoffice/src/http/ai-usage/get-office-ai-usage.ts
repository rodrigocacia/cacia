'use server';

import { HTTPError } from 'ky';

import { api } from '../api-client';
import { mensagemDeErro } from '../mensagem-de-erro';
import { queryDoIntervalo, type IntervaloDeConsumo } from '@/utils/consumo-ia';

import type { PeriodoDeConsumo, ValoresDeConsumo } from './get-ai-usage';

export type ChaveDeCategoria = 'atendimento' | 'memoria' | 'busca';

/**
 * `GET /admin/offices/:id/ai-usage`, já traduzido pelo adaptador — por isso
 * em snake_case.
 */
export interface GetOfficeAiUsageResponse {
  periodo: PeriodoDeConsumo;
  margem_percentual: number;
  total: ValoresDeConsumo;
  /** Período imediatamente anterior, de mesma duração. */
  total_anterior: ValoresDeConsumo;
  /** Nulo quando o período anterior não teve consumo para comparar. */
  variacao_percentual: number | null;
  conversas_atendidas: number;
  respostas_da_ia: number;
  valor_medio_por_resposta: ValoresDeConsumo;
  categorias: {
    chave: ChaveDeCategoria;
    rotulo: string;
    descricao: string;
    custo: number;
    cobrado: number;
    chamadas: number;
    tokens: number;
    /** Participação no custo, em pontos percentuais inteiros. */
    percentual: number;
  }[];
  /** Todos os dias do período, inclusive os sem consumo. */
  por_dia: ({ dia: string } & ValoresDeConsumo)[];
  por_modelo: {
    provedor: string;
    modelo: string;
    sem_preco: boolean;
    chamadas: number;
    tokens_entrada: number;
    tokens_em_cache: number;
    tokens_saida: number;
    custo: number;
  }[];
  chamadas_na_reserva: number;
}

export async function getOfficeAiUsage(
  officeId: string,
  intervalo: IntervaloDeConsumo,
): Promise<
  | { success: true; data: GetOfficeAiUsageResponse }
  | { success: false; error: string }
> {
  try {
    const result = await api
      .get(
        `admin/offices/${encodeURIComponent(officeId)}/ai-usage${queryDoIntervalo(intervalo)}`,
      )
      .json<GetOfficeAiUsageResponse>();

    return { success: true, data: result };
  } catch (err) {
    if (err instanceof HTTPError) {
      const corpo: unknown = await err.response.json().catch(() => null);
      return {
        success: false,
        error:
          err.response.status === 404
            ? 'Escritório não encontrado'
            : mensagemDeErro(corpo, 'Erro ao carregar o consumo de IA'),
      };
    }

    console.error('Erro inesperado:', err);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

'use server';

import { HTTPError } from 'ky';

import { api } from '../api-client';
import { mensagemDeErro } from '../mensagem-de-erro';

/**
 * Parâmetros de cobrança da IA — `admin/ai-billing` e `admin/ai-prices`.
 *
 * Toda escrita devolve o estado completo, o mesmo do GET: a tela troca o que
 * tem pelo que voltou, sem precisar recarregar.
 *
 * Resposta já traduzida pelo adaptador (snake_case). O corpo enviado vai em
 * camelCase, que o adaptador deixa como está.
 */
export interface AiBilling {
  margem_percentual: number;
  /** R$ por US$ 1. */
  cambio: number;
  precos: PrecoDeModelo[];
}

export interface PrecoDeModelo {
  modelo: string;
  entrada_usd_por_milhao: number;
  entrada_em_cache_usd_por_milhao: number;
  saida_usd_por_milhao: number;
  atualizado_em: string;
}

type Resultado =
  { success: true; data: AiBilling } | { success: false; error: string };

async function executar(
  requisicao: () => Promise<AiBilling>,
  padrao: string,
): Promise<Resultado> {
  try {
    return { success: true, data: await requisicao() };
  } catch (err) {
    if (err instanceof HTTPError) {
      const corpo: unknown = await err.response.json().catch(() => null);
      return { success: false, error: mensagemDeErro(corpo, padrao) };
    }

    console.error('Erro inesperado:', err);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

export async function getAiBilling(): Promise<Resultado> {
  return executar(
    () => api.get('admin/ai-billing').json<AiBilling>(),
    'Erro ao carregar os parâmetros de cobrança',
  );
}

export async function updateAiBilling(dados: {
  margemPercentual?: number;
  cambio?: number;
}): Promise<Resultado> {
  return executar(
    () => api.put('admin/ai-billing', { json: dados }).json<AiBilling>(),
    'Erro ao salvar os parâmetros de cobrança',
  );
}

export async function upsertAiPrice(
  modelo: string,
  preco: {
    entradaUsdPorMilhao: number;
    entradaEmCacheUsdPorMilhao: number;
    saidaUsdPorMilhao: number;
  },
): Promise<Resultado> {
  return executar(
    () =>
      api
        .put(`admin/ai-prices/${encodeURIComponent(modelo)}`, { json: preco })
        .json<AiBilling>(),
    'Erro ao salvar o preço do modelo',
  );
}

export async function deleteAiPrice(modelo: string): Promise<Resultado> {
  return executar(
    () =>
      api
        .delete(`admin/ai-prices/${encodeURIComponent(modelo)}`)
        .json<AiBilling>(),
    'Erro ao remover o preço do modelo',
  );
}

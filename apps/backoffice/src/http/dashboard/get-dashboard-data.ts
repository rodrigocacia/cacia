/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { api } from '../api-client';

export interface DashboardPlan {
  id: string;
  name: string;
  value: number;
}

export interface DashboardSubscription {
  plan: string;
  name: string;
  office: string;
  value: string;
  date: string;
}

export interface DashboardSubscriptionByMonth {
  month: string;
  value: number;
}

export interface GetDashboardDataResponse {
  users: number;
  offices: number;
  /**
   * Se os números de faturamento existem.
   *
   * A cobrança não foi reimplementada — ver docs/ESTADO.md. As coleções abaixo
   * vêm vazias, e a tela mostra "indisponível" em vez de R$ 0,00: zero se
   * confunde com "nenhuma venda no período", que é outra coisa.
   */
  faturamentoDisponivel: boolean;
  revenue: number;
  averageTicket: number;
  plans: DashboardPlan[];
  recentSubscriptions: DashboardSubscription[];
  subscriptionsByMonth: DashboardSubscriptionByMonth[];
}

/** O que a API devolve hoje. */
interface PainelDaApi {
  users: number;
  offices: number;
  faturamento: { disponivel: boolean };
}

/**
 * Os quatro parâmetros continuam na assinatura para não mexer em quem chama,
 * mas não são usados: eram filtros do painel de faturamento, que dependia da
 * cobrança. Ver docs/ESTADO.md.
 */
export async function getDashboardData(
  _planId?: string,
  _startDate?: string,
  _endDate?: string,
  _status?: string,
) {
  try {
    // Os filtros de plano e de período pertenciam ao painel de faturamento,
    // que dependia da cobrança. Sem ela, o painel mostra o que existe:
    // contagem de usuários e escritórios, e os cadastros mais recentes.
    const resposta = await api
      .get('admin/dashboard', {
        next: {
          tags: ['dashboard'],
          revalidate: 300,
        },
      })
      .json<PainelDaApi>();

    const data: GetDashboardDataResponse = {
      users: resposta.users,
      offices: resposta.offices,
      faturamentoDisponivel: resposta.faturamento.disponivel,
      // Coleções vazias em vez de ausentes: a tela percorre as três, e um
      // `undefined` aqui derrubaria a renderização inteira.
      revenue: 0,
      averageTicket: 0,
      plans: [],
      recentSubscriptions: [],
      subscriptionsByMonth: [],
    };

    return { success: true, data };
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

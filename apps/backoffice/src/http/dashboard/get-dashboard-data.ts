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
  revenue: number;
  averageTicket: number;
  plans: DashboardPlan[];
  recentSubscriptions: DashboardSubscription[];
  subscriptionsByMonth: DashboardSubscriptionByMonth[];
}

export async function getDashboardData(
  planId?: string,
  startDate?: string,
  endDate?: string,
  status?: string,
) {
  try {
    let url = `dashboard?planId=${planId}&startDate=${startDate}&endDate=${endDate}`;
    if (status !== '-') {
      url += `&status=${status}`;
    }
    const result = await api
      .get(url, {
        next: {
          tags: ['dashboard'],
          revalidate: 300,
        },
      })
      .json<GetDashboardDataResponse>();

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

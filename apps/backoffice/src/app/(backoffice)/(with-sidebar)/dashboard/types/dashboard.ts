import { DashboardPlan } from '@/http/dashboard/get-dashboard-data';

export interface Subscription {
  plan: string;
  name: string;
  office: string;
  value: string;
  date: string;
}

export interface DashboardData {
  users: number;
  offices: number;
  /** `null` enquanto a cobrança não existe. */
  revenue: string | null;
  averageTicket: string | null;
  plans: DashboardPlan[];
  subscriptionsByMonth: { month: string; value: number }[];
  recentSubscriptions: Subscription[];
}

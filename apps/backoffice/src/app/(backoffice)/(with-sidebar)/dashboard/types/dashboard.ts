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
  revenue: string;
  averageTicket: string;
  plans: DashboardPlan[];
  subscriptionsByMonth: { month: string; value: number }[];
  recentSubscriptions: Subscription[];
}

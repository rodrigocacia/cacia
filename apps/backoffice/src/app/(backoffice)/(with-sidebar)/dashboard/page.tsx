import { Header } from "@/components/header";
import { FinancialCard } from "./cards/financial";
import { RecentSubscriptions } from "./tables/recent-subscriptions";
import { CustomPieChart } from "./charts/pie-chart";
import { CustomLineChart } from "./charts/line-chart";
import { DashboardData } from "./types/dashboard";
import { StatisticCard } from "./cards/statistic";
import { getDashboardData } from "@/http/dashboard/get-dashboard-data";
import { DashboardFilters } from "./components/dashboard-filters";
import { PlanFilter } from "./components/plan-filter";

function calculateDateRange(periodDays: string): {
  startDate: string;
  endDate: string;
} {
  const endDate = new Date();
  const startDate = new Date();

  if (periodDays === "-") {
    startDate.setFullYear(2024, 0, 1);
    endDate.setFullYear(2026, 0, 31);
  } else if (periodDays === ".1") {
    startDate.setHours(startDate.getHours() - 1);
  } else {
    const days = parseInt(periodDays);
    startDate.setDate(startDate.getDate() - days);
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; plan?: string; status?: string }>;
}) {
  const { period = "-", plan, status = "-" } = await searchParams;

  const { startDate, endDate } = calculateDateRange(period);

  const dashboardResponse = await getDashboardData(
    plan || process.env.NEXT_PUBLIC_PLAN_ID,
    startDate,
    endDate,
    status,
  );

  if (!dashboardResponse.success) {
    return (
      <div className="w-full h-full">
        <Header title="Dashboard" />
        <main className="pt-4 px-4 sm:pt-6 sm:pl-6 sm:pr-6 xs:pt-6 xs:pl-6 xs:pr-6 md:pt-8 md:pl-0 md:pr-0">
          <div className="text-center text-red-500">
            Erro ao carregar dados do dashboard. Tente novamente mais tarde.
          </div>
        </main>
      </div>
    );
  }

  const apiData = dashboardResponse.data!;

  const formatCurrency = (valor: number | string) =>
    `R$${(Number(valor) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const formatDate = (data: string) =>
    new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

  const data: DashboardData = {
    users: apiData.users,
    offices: apiData.offices,
    // "Indisponível", e não R$ 0,00: zero se confunde com "nenhuma venda no
    // período", que é outra coisa. A cobrança não foi reimplementada — ver
    // docs/ESTADO.md.
    revenue: apiData.faturamentoDisponivel
      ? formatCurrency(apiData.revenue)
      : "Indisponível",
    averageTicket: apiData.faturamentoDisponivel
      ? formatCurrency(apiData.averageTicket)
      : "Indisponível",
    plans: apiData.plans,
    subscriptionsByMonth: apiData.subscriptionsByMonth,
    recentSubscriptions: apiData.recentSubscriptions.map((sub) => ({
      ...sub,
      value: formatCurrency(sub.value),
      date: formatDate(sub.date),
    })),
  };

  const selectedPlan = plan || data.plans[0]?.id || "";

  let planSpecificData = data.subscriptionsByMonth;
  if (plan) {
    const planDashboardResponse = await getDashboardData(
      plan,
      startDate,
      endDate,
      status,
    );
    if (planDashboardResponse.success) {
      planSpecificData = planDashboardResponse.data!.subscriptionsByMonth;
    }
  }

  return (
    <div className="w-full h-full max-lg:px-4">
      <Header title="Dashboard" />

      <DashboardFilters selectedPeriod={period} selectedStatus={status} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 gap-4 md:mb-8">
        <FinancialCard
          label="Faturamento total"
          value={data.revenue}
          icon="mdi:attach-money"
        />
        <FinancialCard
          label="Ticket médio"
          value={data.averageTicket}
          icon="mdi:chart-finance"
        />
        <div className="md:ml-10">
          <StatisticCard
            label="Usuários"
            value={`${data.users} `}
            icon="mdi:account-group"
          />
        </div>
        <StatisticCard
          label="Escritórios"
          value={`${data.offices}`}
          icon="mdi:handshake"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="flex-1 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-1 gap-4 md:gap-6">
            <div className="rounded-2xl bg-white shadow-md p-4 md:p-6 flex flex-col h-full min-h-[320px]">
              <h3 className="text-base text-[#3D3D3D] font-semibold text-lg mb-3">
                Assinaturas por plano
              </h3>
              <div className="flex-1 flex flex-col justify-center">
                <CustomPieChart
                  data={data.plans.map((plan) => ({
                    name: plan.name,
                    id: plan.id,
                    total: plan.value,
                  }))}
                />
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white shadow-md p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <h3 className="text-base text-[#3D3D3D] font-medium">
                Assinaturas por período
              </h3>
              <PlanFilter selectedPlan={selectedPlan} plans={data.plans} />
            </div>
            <p className="text-sm font-light text-[#707070] mb-2">
              Acompanhe os detalhes de suas vendas por assinaturas.
            </p>
            <CustomLineChart
              data={planSpecificData.map((month) => ({
                date: month.month,
                total: month.value,
              }))}
            />
          </div>
        </div>
        <div className="w-full md:w-80">
          <div className="rounded-2xl bg-white shadow-md p-4 md:p-6 h-full min-h-[320px]">
            <RecentSubscriptions data={data.recentSubscriptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

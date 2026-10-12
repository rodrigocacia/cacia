import { Header } from "@/components/header";
import { PageHeader } from "@/components/ui/page-header";
import { FaixaDeIndicadores } from "./cards/kpi";
import { RecentSubscriptions } from "./tables/recent-subscriptions";
import { CustomPieChart } from "./charts/pie-chart";
import { CustomLineChart } from "./charts/line-chart";
import { DashboardData } from "./types/dashboard";
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
      <div className="w-full">
        <Header title="Dashboard" />
        <PageHeader title="Dashboard" />
        <p className="mt-6 rounded-[14px] border border-filete bg-white px-5 py-8 text-center text-[13.5px] text-tinta-2">
          Erro ao carregar dados do dashboard. Tente novamente mais tarde.
        </p>
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
    // `null` ("—" na tela), e não R$ 0,00: zero se confunde com "nenhuma
    // venda no período", que é outra coisa. A cobrança não foi reimplementada — ver
    // docs/ESTADO.md.
    revenue: apiData.faturamentoDisponivel
      ? formatCurrency(apiData.revenue)
      : null,
    averageTicket: apiData.faturamentoDisponivel
      ? formatCurrency(apiData.averageTicket)
      : null,
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

  const totalDeAssinaturas = data.plans.reduce(
    (soma, item) => soma + item.value,
    0,
  );
  const temSerie = planSpecificData.some((mes) => mes.value > 0);

  return (
    <div className="w-full">
      <Header title="Dashboard" />

      <div className="flex flex-col gap-6">
        <PageHeader
          title="Dashboard"
          description="Usuários, escritórios e assinaturas da plataforma."
          action={
            <DashboardFilters selectedPeriod={period} selectedStatus={status} />
          }
        />

        <FaixaDeIndicadores
          itens={[
            {
              rotulo: "Faturamento total",
              valor: data.revenue,
              nota:
                data.revenue === null
                  ? "Cobrança ainda não ativada"
                  : "No período",
            },
            {
              rotulo: "Ticket médio",
              valor: data.averageTicket,
              nota:
                data.averageTicket === null
                  ? "Cobrança ainda não ativada"
                  : "Por assinatura",
            },
            {
              rotulo: "Usuários",
              valor: String(data.users),
              nota: "Cadastrados na plataforma",
            },
            {
              rotulo: "Escritórios",
              valor: String(data.offices),
              nota: "Cadastrados na plataforma",
            },
          ]}
        />

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <section className="rounded-[14px] border border-filete bg-white p-5">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-[14.5px] font-semibold text-tinta">
                Assinaturas por plano
              </h2>
              {totalDeAssinaturas > 0 && (
                <span className="font-mono text-xs text-tinta-3 tabular">
                  {totalDeAssinaturas}
                </span>
              )}
            </div>
            {totalDeAssinaturas > 0 ? (
              <CustomPieChart
                data={data.plans.map((plan) => ({
                  name: plan.name,
                  id: plan.id,
                  total: plan.value,
                }))}
              />
            ) : (
              <SemDados texto="Nenhuma assinatura no período." />
            )}
          </section>

          <section className="rounded-[14px] border border-filete bg-white p-5">
            <RecentSubscriptions data={data.recentSubscriptions} />
          </section>
        </div>

        <section className="rounded-[14px] border border-filete bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-[14.5px] font-semibold text-tinta">
                Assinaturas por período
              </h2>
              <p className="text-[13px] text-tinta-3">
                Novas assinaturas mês a mês.
              </p>
            </div>
            {data.plans.length > 0 && (
              <PlanFilter selectedPlan={selectedPlan} plans={data.plans} />
            )}
          </div>
          {temSerie ? (
            <CustomLineChart
              data={planSpecificData.map((month) => ({
                date: month.month,
                total: month.value,
              }))}
            />
          ) : (
            <div className="mt-4">
              <SemDados texto="Ainda não há assinaturas para mostrar no gráfico." />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SemDados({ texto }: { texto: string }) {
  return (
    <p className="rounded-[10px] bg-papel-2 px-4 py-6 text-center text-[13.5px] text-tinta-3">
      {texto}
    </p>
  );
}

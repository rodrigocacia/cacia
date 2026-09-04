import { Header } from "@/components/header"
import {
  DashboardData,
  getDashboardData,
} from "@/http/dashboard/get-dashboard-data"
import { processStatusConfig, ProcessStatus } from "@/types/process"
import { UnauthorizedRedirectError } from "@/lib/erros"
import { redirect } from "next/navigation"
import { EmptySearch } from "@/components/empty-search"
import { Statistic } from "./dashboard/statistic"
import { CustomGaugeChart } from "./dashboard/charts/gauge-chart"
import { CustomAvatar } from "@/components/ui/custom-avatar"
import { formatProcess, formatName } from "@/utils/formatters"
import { FiltersDashboard } from "./dashboard/filters-dashboard"
import { calculateDateRange } from "@/utils/calculate-date-range"

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string
    plan?: string
    status?: string
    startDate?: string
    endDate?: string
  }>
}) {
  const { period = "-", startDate, endDate } = await searchParams

  let data: DashboardData | null = null

  let startDateValue = "-"
  let endDateValue = "-"

  if (startDate && endDate) {
    startDateValue = startDate
    endDateValue = endDate
  }

  if (!startDate && !endDate) {
    const { startDate: startDateByPeriod, endDate: endDateByPeriod } =
      calculateDateRange(period)
    startDateValue = startDateByPeriod
    endDateValue = endDateByPeriod
  }

  try {
    data = await getDashboardData(startDateValue, endDateValue)
  } catch (error) {
    if (error instanceof UnauthorizedRedirectError) {
      if (typeof window === "undefined") {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/reset`, {
          method: "GET",
        })

        redirect("/signin")
      }
    }
  }

  return (
    <div className="w-full h-full max-lg:px-4">
      <Header title="Dashboard" />

      <FiltersDashboard />

      <div className="w-full flex flex-col">
        <Statistic data={data?.summary} />

        <div className="mt-[38px] grid grid-cols-[3fr_1.3fr] max-md:grid-cols-1 gap-[14px]">
          <div className="h-fit rounded-2xl bg-white shadow-md px-4 py-4 max-md:px-2.5 max-md:py-2.5">
            <h3 className="text-base text-[#3D3D3D] font-semibold">
              Andamento geral
            </h3>

            <div className="w-full mt-3 rounded-2xl bg-[#FCFCFD] p-3.5 max-md:p-2.5">
              {data?.processStatus && data?.processStatus?.length === 0 && (
                <EmptySearch
                  title="Nenhum processo encontrado"
                  subtitle="Não foi encontrado nenhum processo"
                />
              )}

              {data?.processStatus && data?.processStatus?.length > 0 && (
                <div className="flex flex-col gap-8">
                  <div className="flex max-md:flex-col items-center gap-10">
                    <div>
                      <CustomGaugeChart data={data?.processStatus} />
                    </div>

                    <div className="flex flex-col gap-3.5">
                      <h3 className="text-[12px] text-[#BDBDBD]">STATUS</h3>

                      {data?.processStatus.map((status) => (
                        <div key={status._id} className="flex gap-2">
                          <div
                            className={`w-4 h-4 rounded-full ${
                              status._id === "done"
                                ? "bg-[#73D076]"
                                : status._id === "pending"
                                  ? "bg-[#EDD361]"
                                  : "bg-[#BDBDBD]"
                            }`}
                          ></div>

                          <h3 className="text-sm text-[#707070] font-semibold">
                            {status._id === "done"
                              ? "Concluídos"
                              : status._id === "pending"
                                ? "Em andamento"
                                : "Outros"}
                          </h3>

                          <span className="text-sm text-[#BDBDBD]">
                            {status.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    <h3 className="text-[12px] max-md:text-[10px] text-[#BDBDBD]">
                      TIPO DE PROCESSO
                    </h3>

                    <div className="flex gap-3 max-md:gap-[10px]">
                      {data?.processType.map((type) => (
                        <div
                          key={type._id}
                          className="px-3 py-1.5 max-md:px-[4px] max-md:py-[4px] flex items-center justify-center gap-1 rounded-[6px] bg-[#ECF7F8]"
                        >
                          <h4 className="text-sm max-md:text-[12px] font-semibold text-[#707070]">
                            {type._id}
                          </h4>

                          <span className="text-sm max-md:text-[12px] font-semibold text-[#348C98]">
                            {type.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-md px-3 py-4">
            <div>
              <h3 className="text-base text-[#3D3D3D] font-semibold">
                Últimos processos
              </h3>
            </div>

            {data?.lastProcesses.length === 0 && (
              <EmptySearch
                title="Nenhum processo encontrado"
                subtitle="Nenhum processo encontrado"
              />
            )}

            <div className="mt-6 flex flex-col gap-1.5">
              {data?.lastProcesses.map((process) => (
                <div
                  key={process._id}
                  className="w-full flex items-start justify-between p-2.5 border border-gray-200 rounded-[14px] shadow-xs"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm text-[#707070] font-semibold">
                        Processo
                      </h3>
                      <h3 className="text-sm text-[#707070] font-semibold">
                        {formatProcess(process?.number).length > 15
                          ? `${formatProcess(process?.number).slice(0, 15)}...`
                          : formatProcess(process?.number)}
                      </h3>
                    </div>

                    <div className="flex gap-2.5 justify-start">
                      <CustomAvatar name={process?.customer?.name} size="sm" />

                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm text-[#707070] font-semibold">
                          {formatName(process.customer.name.split(" ")[0])}{" "}
                          {formatName(
                            process.customer.name.split(" ")[
                              process.customer.name.split(" ").length - 1
                            ]
                          )}
                        </h3>

                        {process.progress.length > 0 && (
                          <p className="text-[10px]">
                            <strong>Último andamento:</strong>{" "}
                            {process.progress[0].title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`px-2 py-1 rounded-full flex items-center justify-center ${
                      processStatusConfig[process.status as ProcessStatus]
                        ?.color || "bg-[#F3F4F6]"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-semibold ${
                        processStatusConfig[process.status as ProcessStatus]
                          ?.text || "text-[#707070]"
                      }`}
                    >
                      {processStatusConfig[process.status as ProcessStatus]
                        ?.label || "Outro"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

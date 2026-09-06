import Link from "next/link"
import { clsx } from "clsx"
import { redirect } from "next/navigation"

import { Header } from "@/components/header"
import { EmptySearch } from "@/components/empty-search"
import { CustomAvatar } from "@/components/ui/custom-avatar"
import { UnauthorizedRedirectError } from "@/lib/erros"
import { formatProcess, formatName } from "@/utils/formatters"
import { calculateDateRange } from "@/utils/calculate-date-range"
import { processStatusConfig, processTypeConfig } from "@/types/process"
import {
  DashboardData,
  getDashboardData,
} from "@/http/dashboard/get-dashboard-data"

import { Statistic } from "./statistic"
import { CustomGaugeChart } from "./charts/gauge-chart"
import { FiltersDashboard } from "./filters-dashboard"

/**
 * A tela inicial, usada por "/" e por "/dashboard".
 *
 * As duas rotas tinham uma cópia inteira desta tela, e as cópias já haviam
 * divergido: a de "/" rotulava os status comparando com "done" e "pending" —
 * valores que a API nunca devolveu — e não tinha o link para o processo. Uma
 * tela só, para as duas rotas.
 */
export async function Painel({
  period = "-",
  startDate,
  endDate,
}: {
  period?: string
  startDate?: string
  endDate?: string
}) {
  let inicio = "-"
  let fim = "-"

  if (startDate && endDate) {
    inicio = startDate
    fim = endDate
  } else {
    const intervalo = calculateDateRange(period)
    inicio = intervalo.startDate
    fim = intervalo.endDate
  }

  let data: DashboardData | null = null

  try {
    data = await getDashboardData(inicio, fim)
  } catch (error) {
    if (error instanceof UnauthorizedRedirectError) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/reset`, {
        method: "GET",
      })

      redirect("/signin")
    }

    throw error
  }

  const porStatus = data?.process_status ?? []
  const porTipo = data?.process_type ?? []
  const ultimos = data?.last_processes ?? []

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
              {porStatus.length === 0 && (
                <EmptySearch
                  title="Nenhum processo encontrado"
                  subtitle="Não foi encontrado nenhum processo"
                />
              )}

              {porStatus.length > 0 && (
                <div className="flex flex-col gap-8">
                  <div className="flex max-md:flex-col items-center gap-10">
                    <div>
                      <CustomGaugeChart data={porStatus} />
                    </div>

                    <div className="flex flex-col gap-3.5">
                      <h3 className="text-[12px] text-[#BDBDBD]">STATUS</h3>

                      {porStatus.map((linha) => {
                        const config = processStatusConfig[linha.status]

                        return (
                          <div key={linha.status} className="flex gap-2">
                            {/* bg-current pinta o círculo com a mesma cor que
                                o rótulo do status já usa em toda a aplicação,
                                sem repetir o hexadecimal aqui. */}
                            <div
                              className={clsx(
                                "w-4 h-4 rounded-full bg-current",
                                config?.text ?? "text-[#BDBDBD]"
                              )}
                            />

                            <h3 className="text-sm text-[#707070] font-semibold">
                              {config?.label ?? linha.status}
                            </h3>

                            <span className="text-sm text-[#BDBDBD]">
                              {linha.total}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    <h3 className="text-[12px] max-md:text-[10px] text-[#BDBDBD]">
                      TIPO DE PROCESSO
                    </h3>

                    <div className="flex gap-3 max-md:gap-[10px] flex-wrap">
                      {porTipo.map((linha) => (
                        <div
                          key={linha.type}
                          className="px-3 py-1.5 max-md:px-[4px] max-md:py-[4px] flex items-center justify-center gap-1 rounded-[6px] bg-[#ECF7F8]"
                        >
                          <h4 className="text-sm max-md:text-[12px] font-semibold text-[#707070]">
                            {processTypeConfig[linha.type] ?? "Outro"}
                          </h4>

                          <span className="text-sm max-md:text-[12px] font-semibold text-[#348C98]">
                            {linha.total}
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

            {ultimos.length === 0 && (
              <EmptySearch
                title="Nenhum processo encontrado"
                subtitle="Nenhum processo encontrado"
              />
            )}

            <div className="mt-6 flex flex-col gap-1.5">
              {ultimos.map((processo) => {
                const config = processStatusConfig[processo.status]
                const nome = processo.customer?.name ?? "Sem cliente"

                return (
                  <Link
                    href={`/process/${processo._id}/progress`}
                    className="flex items-center justify-between"
                    key={processo._id}
                  >
                    <div className="flex items-start justify-between w-full p-2.5 border border-gray-200 rounded-[14px] shadow-xs">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-sm text-[#707070] font-semibold">
                            Processo
                          </h3>
                          <h3 className="text-sm text-[#707070] font-semibold">
                            {formatProcess(processo.number)}
                          </h3>
                        </div>

                        <div className="flex gap-2.5 justify-start">
                          <CustomAvatar name={nome} size="sm" />

                          <div className="flex flex-col gap-1">
                            <h3 className="text-sm text-[#707070] font-semibold">
                              {nomeCurto(nome)}
                            </h3>

                            {processo.description && (
                              <p className="text-[10px] text-[#707070]">
                                {processo.description.substring(0, 80)}
                                {processo.description.length > 80 && "..."}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={clsx(
                          "px-2 py-1 rounded-full flex items-center justify-center",
                          config?.color ?? "bg-[#F3F4F6]"
                        )}
                      >
                        <span
                          className={clsx(
                            "text-[10px] font-semibold",
                            config?.text ?? "text-[#707070]"
                          )}
                        >
                          {config?.label ?? "Outro"}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Primeiro e último nome, que é o que cabe no cartão. */
function nomeCurto(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  const primeiro = formatName(partes[0] ?? "")

  if (partes.length < 2) return primeiro

  return `${primeiro} ${formatName(partes[partes.length - 1] ?? "")}`
}

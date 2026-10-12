import { Suspense } from "react";

import { SWRConfig } from "swr";

import { Landmark } from "lucide-react";

import { getRecurrences } from "@/http/recurrence/get-recurrences";

import { Header } from "@/components/header";
import { PageHeader } from "@/components/ui/page-header";
import { CustomSearchFilter } from "@/components/ui/custom-search-filter";
import { FinancialFiltersButton } from "@/components/tables/financial-filters-button";
import { LoadingText } from "@/components/ui/sppiner";

import { FinancialTable } from "@/components/tables/financial-table";

export default async function Financial({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const { page, search, status } = await searchParams;

  const recurrences = await getRecurrences({
    page: Number(page) || 1,
    search,
    status: status === "-" ? undefined : status,
  });

  return (
    <div className="w-full">
      <Header title="Financeiro" />

      <PageHeader
        title="Financeiro"
        count={recurrences.disponivel ? recurrences?.totalItems : undefined}
        description="Histórico de pagamentos das assinaturas."
      />

      {/*
        Sem cobrança, busca e filtros não têm o que filtrar, e a tabela vazia
        diria "nenhum resultado" — como se houvesse cobranças e nenhuma
        batesse com a pesquisa.
      */}
      {!recurrences.disponivel ? (
        <div className="mt-6 flex w-full items-start gap-3.5 rounded-[14px] border border-filete bg-white p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-papel-2 text-tinta-3">
            <Landmark size={18} strokeWidth={1.7} aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-[14.5px] font-semibold text-tinta">
              Cobrança ainda não ativada
            </p>
            <p className="text-[13.5px] text-tinta-3">
              Os pagamentos das assinaturas aparecem aqui assim que a cobrança
              for ligada.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 flex w-full items-center gap-2.5">
            <Suspense fallback={<LoadingText />}>
              <CustomSearchFilter placeholder="Buscar por cliente ou valor..." />
            </Suspense>

            <FinancialFiltersButton />
          </div>

          <SWRConfig
            value={{
              fallback: {
                recurrences: recurrences,
              },
              revalidateOnFocus: true,
              revalidateIfStale: true,
              revalidateOnReconnect: true,
              refreshInterval: 0,
            }}
          >
            <FinancialTable />
          </SWRConfig>
        </>
      )}
    </div>
  );
}

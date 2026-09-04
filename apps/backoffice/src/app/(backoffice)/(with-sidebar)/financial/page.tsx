import { Suspense } from "react";

import { SWRConfig } from "swr";

import { Icon } from "@iconify/react/dist/iconify.js";

import { getRecurrences } from "@/http/recurrence/get-recurrences";

import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb";
import { CustomSearchFilter } from "@/components/ui/custom-search-filter";
import { FinancialFiltersButton } from "@/components/tables/financial-filters-button";
import { LoadingText } from "@/components/ui/sppiner";

import { financialCrumbs } from "@/constants/breadcrumbs";
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
    <div className="w-full h-full max-lg:px-4">
      <Header title="Financeiro" />

      <Breadcrumbs crumbs={financialCrumbs} />

      <div className="w-full flex items-start justify-between mt-8 max-md:hidden">
        <div className="flex gap-2 mb-4">
          <Icon icon="mdi:bank-outline" className="text-[#BDBDBD] w-8 h-8" />

          <h3 className="text-[18px] text-[#3D3D3D] font-bold">
            Histórico de pagamentos
          </h3>

          <div className="w-7 h-7 flex items-center justify-center bg-[#E0E6EB] rounded-full">
            <span className="text-base text-[#707070] font-bold">
              {recurrences?.totalItems}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full flex items-center gap-3 max-md:mt-3.5">
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
    </div>
  );
}

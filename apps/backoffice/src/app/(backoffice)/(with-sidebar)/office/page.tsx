import { Suspense } from "react";

import Link from "next/link";
import { Plus } from "lucide-react";

import { SWRConfig } from "swr";

import { getOffices } from "@/http/office/get-offices";

import { Header } from "@/components/header";
import { OfficesTable } from "@/components/tables/offices-table";
import { PageHeader } from "@/components/ui/page-header";
import { CustomSearchFilter } from "@/components/ui/custom-search-filter";
import { OfficesFiltersButton } from "@/components/tables/offices-filters-button";
import { LoadingText } from "@/components/ui/sppiner";
import { Button } from "@/components/ui/custom-button";

import { Form } from "./new/steps";

export default async function Lead({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}) {
  const { page, search, status } = await searchParams;

  const offices = await getOffices({
    page: Number(page) || 1,
    search,
    status,
  });

  return (
    <div className="w-full">
      <Header title="Escritórios" />

      <PageHeader
        title="Escritórios"
        count={offices?.totalItems}
        description="Escritórios cadastrados, plano e situação de cada um."
        action={
          <Link href="?novo=1" scroll={false}>
            <Button
              variant="primary"
              iconLeft={<Plus size={16} strokeWidth={2} />}
            >
              Novo escritório
            </Button>
          </Link>
        }
      />

      <div className="mt-5 flex w-full items-center gap-2.5">
        <Suspense fallback={<LoadingText />}>
          <CustomSearchFilter placeholder="Buscar por nome ou documento..." />
        </Suspense>

        <OfficesFiltersButton />
      </div>

      <SWRConfig
        value={{
          fallback: {
            offices: offices,
          },
          revalidateOnFocus: true,
          revalidateIfStale: true,
          revalidateOnReconnect: true,
          refreshInterval: 0,
        }}
      >
        <OfficesTable />
      </SWRConfig>

      {/*
        Uma instância só: o formulário decide entre Sheet e Drawer pela
        largura da tela. Duas instâncias abriam dois painéis sobrepostos.
      */}
      <Form />
    </div>
  );
}

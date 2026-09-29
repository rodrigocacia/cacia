import { Suspense } from "react";

import Link from "next/link";
import { FaPlus } from "react-icons/fa";

import { SWRConfig } from "swr";

import { Icon } from "@/components/icone";

import { getOffices } from "@/http/office/get-offices";

import { Header } from "@/components/header";
import { OfficesTable } from "@/components/tables/offices-table";
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb";
import { CustomSearchFilter } from "@/components/ui/custom-search-filter";
import { OfficesFiltersButton } from "@/components/tables/offices-filters-button";
import { LoadingText } from "@/components/ui/sppiner";
import { Button } from "@/components/ui/custom-button";

import { Form } from "./new/steps";
import { officeCrumbs } from "@/constants/breadcrumbs";

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
    <div className="w-full h-full max-lg:px-4">
      <Header title="Escritórios" />

      <Breadcrumbs crumbs={officeCrumbs} />

      <div className="w-full flex items-start justify-between mt-8 mb-4 max-md:hidden">
        <div className="flex gap-2">
          <Icon
            icon="mdi:office-building-outline"
            className="text-[#BDBDBD] w-8 h-8"
          />

          <h3 className="text-[18px] text-[#3D3D3D] font-bold">Escritórios</h3>

          <div className="w-7 h-7 flex items-center justify-center bg-[#E0E6EB] rounded-full">
            <span className="text-base text-[#707070] font-bold">
              {offices?.totalItems}
            </span>
          </div>
        </div>

        <Link href="?novo=1" scroll={false}>
          <Button
            className="cursor-pointer"
            variant="primary"
            iconLeft={<FaPlus size={14} />}
          >
            Novo escritório
          </Button>
        </Link>
      </div>

      <div className="w-full flex items-center gap-3 max-md:mt-3.5">
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

      <div className="md:hidden mt-4">
        <Link href="?novo=1" scroll={false}>
          <Button
            className="cursor-pointer"
            variant="primary"
            iconLeft={<FaPlus size={14} />}
          >
            Novo escritório
          </Button>
        </Link>
      </div>

      {/*
        Uma instância só: o formulário decide entre Sheet e Drawer pela
        largura da tela. Duas instâncias abriam dois painéis sobrepostos.
      */}
      <Form />
    </div>
  );
}

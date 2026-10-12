import { Suspense } from "react";

import Link from "next/link";
import { Plus } from "lucide-react";

import { SWRConfig } from "swr";

import { getUsers } from "@/http/user/get-users";

import { Header } from "@/components/header";
import { UsersTable } from "@/components/tables/users-table";
import { PageHeader } from "@/components/ui/page-header";
import { CustomSearchFilter } from "@/components/ui/custom-search-filter";
import { UsersFiltersButton } from "@/components/tables/users-filters-button";
import { LoadingText } from "@/components/ui/sppiner";
import { Button } from "@/components/ui/custom-button";

import { Form } from "./new/steps";

export default async function User({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; role?: string }>;
}) {
  const { page, search, role } = await searchParams;

  const users = await getUsers({
    page: Number(page) || 1,
    search,
    role: role === "-" ? undefined : role,
  });

  return (
    <div className="w-full">
      <Header title="Usuários" />

      <PageHeader
        title="Usuários"
        count={users?.totalItems}
        description="Pessoas com acesso à plataforma e os escritórios de cada uma."
        action={
          <Link href="?novo=1" scroll={false}>
            <Button
              variant="primary"
              iconLeft={<Plus size={16} strokeWidth={2} />}
            >
              Novo usuário
            </Button>
          </Link>
        }
      />

      <div className="mt-5 flex w-full items-center gap-2.5">
        <Suspense fallback={<LoadingText />}>
          <CustomSearchFilter placeholder="Buscar por nome ou e-mail..." />
        </Suspense>

        <UsersFiltersButton />
      </div>

      <SWRConfig
        value={{
          fallback: {
            users: users,
          },
          revalidateOnFocus: true,
          revalidateIfStale: true,
          revalidateOnReconnect: true,
          refreshInterval: 0,
        }}
      >
        <UsersTable />
      </SWRConfig>

      {/*
        Uma instância só: o formulário decide entre Sheet e Drawer pela
        largura da tela. Duas instâncias abriam dois painéis sobrepostos.
      */}
      <Form />
    </div>
  );
}

import { Suspense } from "react";

import { SWRConfig } from "swr";

import { Icon } from "@iconify/react/dist/iconify.js";

import { getUsers } from "@/http/user/get-users";

import { Header } from "@/components/header";
import { UsersTable } from "@/components/tables/users-table";
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb";
import { CustomSearchFilter } from "@/components/ui/custom-search-filter";
import { UsersFiltersButton } from "@/components/tables/users-filters-button";
import { LoadingText } from "@/components/ui/sppiner";

import { Form } from "./new/steps";
import { userCrumbs } from "@/constants/breadcrumbs";

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
    <div className="w-full h-full max-lg:px-4">
      <Header title="Usuários" />

      <Breadcrumbs crumbs={userCrumbs} />

      <div className="w-full flex items-start justify-between mt-8 mb-4 max-md:hidden">
        <div className="flex gap-2">
          <Icon
            icon="mdi:account-group-outline"
            className="text-[#BDBDBD] w-8 h-8"
          />

          <h3 className="text-[18px] text-[#3D3D3D] font-bold">Usuários</h3>

          <div className="w-7 h-7 flex items-center justify-center bg-[#E0E6EB] rounded-full">
            <span className="text-base text-[#707070] font-bold">
              {users?.totalItems}
            </span>
          </div>
        </div>

        <Form />
      </div>

      <div className="w-full flex items-center gap-3 max-md:mt-3.5">
        <Suspense fallback={<LoadingText />}>
          <CustomSearchFilter placeholder="Buscar por nome ou telefone..." />
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

      <div className="md:hidden">
        <Form />
      </div>
    </div>
  );
}

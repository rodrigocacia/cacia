import { PropsWithChildren } from "react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { getOfficeById } from "@/http/office/get-office-by-id";
import { OfficeStatus } from "@/types/office";
import { situacaoValida } from "@/constants/office-status";

import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb";

import { Sidebar } from "./sidebar";
import { officeDetailsCrumbs } from "@/constants/breadcrumbs";
import { HeaderToGoBack } from "@/components/header-to-go-back";
import { formatName } from "@/utils/formatters";

export default async function ProfileLayout({
  children,
  params,
}: PropsWithChildren<{ params: Promise<{ id: string }> }>) {
  const { id: officeId } = await params;

  const { data } = await getOfficeById({ id: officeId });

  let formattedCreatedAtDate = null;

  if (data) {
    if (data?.created_at !== null) {
      formattedCreatedAtDate = format(
        new Date(data?.created_at),
        "MMMM, yyyy",
        {
          locale: ptBR,
        },
      );
    }
  }

  return (
    <div className="w-full h-fit flex flex-col">
      <div className="max-md:hidden">
        <Header title="Escritório" name={formatName(data?.name ?? "")} />

        <Breadcrumbs
          crumbs={officeDetailsCrumbs(
            data?._id ?? "",
            formatName(data?.name ?? ""),
          )}
        />
      </div>

      <div className="md:hidden">
        <HeaderToGoBack link="/office" bgColor="#ECF7F8" />
      </div>

      <div className="w-full grid grid-cols-[280px_1fr] max-md:grid-cols-1 mt-8 max-md:mt-0">
        <Sidebar
          name={formatName(data?.name ?? "")}
          createdAt={formattedCreatedAtDate ?? "-"}
          status={situacaoValida(data?.status) ?? OfficeStatus.PENDING}
        />

        <main className="px-4 pb-12 max-md:px-0 lg:col-start-2 max-md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}

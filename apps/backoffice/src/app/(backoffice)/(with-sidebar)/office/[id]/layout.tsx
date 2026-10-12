import { PropsWithChildren } from "react";
import Link from "next/link";
import { PencilLine } from "lucide-react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { getOfficeById } from "@/http/office/get-office-by-id";
import { OfficeStatus } from "@/types/office";
import {
  SITUACOES_DO_ESCRITORIO,
  situacaoValida,
} from "@/constants/office-status";

import { Header } from "@/components/header";
import { HeaderToGoBack } from "@/components/header-to-go-back";
import { StatusChip } from "@/components/ui/status-chip";
import { nomeParaExibir } from "@/utils/formatters";

import { Sidebar } from "./sidebar";
import { AlternarSituacao } from "./components/alternar-situacao";
import { DialogDeleteOffice } from "./components/dialog-delete-office";

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
        "MMMM 'de' yyyy",
        {
          locale: ptBR,
        },
      );
    }
  }

  const nome = nomeParaExibir(data?.name ?? "");
  const status = situacaoValida(data?.status) ?? OfficeStatus.PENDING;
  const situacao = SITUACOES_DO_ESCRITORIO[status];

  return (
    <div className="flex w-full flex-col">
      <Header title="Escritório" name={nome} />

      <HeaderToGoBack link="/office" label="Escritórios" />

      {/* Cabeçalho da ficha */}
      <section className="flex flex-wrap items-end gap-x-5 gap-y-4 border-b border-filete pb-6 max-md:items-start max-md:gap-x-4">
        <span
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-nevoa font-display text-[28px] text-turquesa-profundo max-md:h-14 max-md:w-14 max-md:text-[24px]"
        >
          {nome.trim()[0]?.toUpperCase() ?? "?"}
        </span>

        <div className="flex min-w-0 flex-1 basis-[240px] flex-col gap-2">
          <h1 className="font-display text-[42px] leading-[1.05] break-words text-tinta max-md:text-[32px]">
            {nome || "Escritório"}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13.5px] text-tinta-2">
            <StatusChip ponto={situacao.ponto}>{situacao.rotulo}</StatusChip>
            <span>Cadastrado desde {formattedCreatedAtDate ?? "—"}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/office/${officeId}/information?editId=${officeId}`}
            className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-filete-forte bg-white px-3.5 text-[13.5px] font-medium text-tinta transition-colors hover:bg-gray-100 focus-visible:ring-[3px] focus-visible:ring-nevoa-2 focus-visible:outline-none"
          >
            <PencilLine size={15} strokeWidth={1.7} aria-hidden />
            Editar
          </Link>

          <AlternarSituacao officeId={officeId} status={status} />

          <DialogDeleteOffice officeId={officeId} officeName={nome} />
        </div>
      </section>

      <div className="grid w-full grid-cols-[minmax(0,1fr)] gap-8 pt-6 md:grid-cols-[200px_minmax(0,1fr)] max-md:gap-0 max-md:pt-5">
        <Sidebar />

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

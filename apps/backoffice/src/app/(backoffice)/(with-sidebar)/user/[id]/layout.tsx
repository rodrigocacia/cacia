import { PropsWithChildren } from "react";
import Link from "next/link";
import { PencilLine } from "lucide-react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { getUserById } from "@/http/user/get-user-by-id";

import { Header } from "@/components/header";
import { HeaderToGoBack } from "@/components/header-to-go-back";
import { nomeParaExibir } from "@/utils/formatters";

import { Sidebar } from "./sidebar";
import { DialogDeleteUser } from "./components/dialog-delete-user";

export default async function ProfileLayout({
  children,
  params,
}: PropsWithChildren<{ params: Promise<{ id: string }> }>) {
  const { id: userId } = await params;

  const { data } = await getUserById({ id: userId });

  let formattedCreatedAtDate = null;

  if (data) {
    if (data.created_at !== null) {
      formattedCreatedAtDate = format(
        new Date(data.created_at),
        "MMMM 'de' yyyy",
        {
          locale: ptBR,
        },
      );
    }
  }

  const nome = nomeParaExibir(data?.name ?? "");
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex w-full flex-col">
      <Header title="Usuário" name={nome} />

      <HeaderToGoBack link="/user" label="Usuários" />

      {/* Cabeçalho da ficha */}
      <section className="flex flex-wrap items-end gap-x-5 gap-y-4 border-b border-filete pb-6 max-md:items-start max-md:gap-x-4">
        <span
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-nevoa font-display text-[26px] text-turquesa-profundo max-md:h-14 max-md:w-14 max-md:text-[22px]"
        >
          {iniciais || "?"}
        </span>

        <div className="flex min-w-0 flex-1 basis-[240px] flex-col gap-2">
          <h1 className="font-display text-[42px] leading-[1.05] break-words text-tinta max-md:text-[32px]">
            {nome || "Usuário"}
          </h1>

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-tinta-2">
            {data?.email && (
              <>
                <span className="break-all">{data.email}</span>
                <span aria-hidden className="text-gray-400 max-sm:hidden">
                  ·
                </span>
              </>
            )}
            <span>Usuário desde {formattedCreatedAtDate ?? "—"}</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/user/${userId}/personal-information?editId=${userId}`}
            className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-filete-forte bg-white px-3.5 text-[13.5px] font-medium text-tinta transition-colors hover:bg-gray-100 focus-visible:ring-[3px] focus-visible:ring-nevoa-2 focus-visible:outline-none"
          >
            <PencilLine size={15} strokeWidth={1.7} aria-hidden />
            Editar
          </Link>

          <DialogDeleteUser userId={userId} userName={nome} />
        </div>
      </section>

      <div className="grid w-full grid-cols-[minmax(0,1fr)] gap-8 pt-6 md:grid-cols-[200px_minmax(0,1fr)] max-md:gap-0 max-md:pt-5">
        <Sidebar />

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

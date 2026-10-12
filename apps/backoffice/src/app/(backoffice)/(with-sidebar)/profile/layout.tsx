import { PropsWithChildren } from "react";

import { Header } from "@/components/header";
import { getMe } from "@/http/user/get-me";
import { nomeParaExibir } from "@/utils/formatters";

import { Sidebar } from "./sidebar";

export default async function ProfileLayout({ children }: PropsWithChildren) {
  const userResult = await getMe();
  const user = userResult.success ? userResult.data : null;

  const nome = nomeParaExibir(user?.name);
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex w-full flex-col">
      <Header title="Minha conta" />

      {/* Cabeçalho da conta */}
      <section className="flex flex-wrap items-end gap-x-5 gap-y-4 border-b border-filete pb-6 max-md:items-start max-md:gap-x-4">
        <span
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-nevoa font-display text-[26px] text-turquesa-profundo max-md:h-14 max-md:w-14 max-md:text-[22px]"
        >
          {iniciais || "?"}
        </span>

        <div className="flex min-w-0 flex-1 basis-[240px] flex-col gap-2">
          <span className="rotulo">Minha conta</span>
          <h1 className="font-display text-[42px] leading-[1.05] break-words text-tinta max-md:text-[32px]">
            {nome || "Minha conta"}
          </h1>
          {user?.email && (
            <p className="text-[13.5px] break-all text-tinta-2">{user.email}</p>
          )}
        </div>
      </section>

      <div className="grid w-full grid-cols-[minmax(0,1fr)] gap-8 pt-6 md:grid-cols-[200px_minmax(0,1fr)] max-md:gap-0 max-md:pt-5">
        <Sidebar />

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

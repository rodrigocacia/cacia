import { PropsWithChildren } from "react"

import { Header } from "@/components/header"
import { PageHeader } from "@/components/ui/page-header"
import { me } from "@/http/user/me"

import { Sidebar } from "./sidebar"

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .filter((parte) => !/^(dr|dra)\.?$/i.test(parte))
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("")
}

export default async function ProfileLayout({ children }: PropsWithChildren) {
  const user = await me()

  const nome = user?.name || ""
  const email = user?.email || ""

  return (
    <div className="flex w-full flex-col pb-12 max-lg:px-4">
      <Header title="Minha conta" />

      <div className="flex items-end gap-5">
        <span
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-nevoa font-display text-[26px] text-turquesa-profundo max-md:h-12 max-md:w-12 max-md:rounded-[14px] max-md:text-[20px]"
        >
          {iniciais(nome) || "?"}
        </span>

        <div className="min-w-0 flex-1">
          <PageHeader
            title="Minha conta"
            description={
              <span className="break-all">
                {nome}
                {email && ` · ${email}`}
              </span>
            }
          />
        </div>
      </div>

      <div className="mt-8 grid gap-8 max-md:mt-6 max-md:gap-6 md:grid-cols-[216px_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0 md:sticky md:top-[76px] md:self-start">
          <Sidebar />
        </aside>

        <main className="flex min-w-0 flex-col gap-6">{children}</main>
      </div>
    </div>
  )
}

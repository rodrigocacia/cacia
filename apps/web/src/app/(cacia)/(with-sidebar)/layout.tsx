import { PropsWithChildren } from "react"

import { redirect } from "next/navigation"

import { isAuthenticated } from "@/auth/auth"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const autheticated = await isAuthenticated()

  if (!autheticated) {
    redirect("/signin")
  }

  return (
    <SidebarProvider className="bg-ink">
      <AppSidebar />

      {/*
        `min-w-0` não é decoração. Este <main> é filho de um flex container (o
        SidebarProvider), e a largura mínima padrão de um item flex é o
        min-content dele — ou seja, ele se recusa a encolher abaixo do conteúdo
        mais largo que carrega.

        O efeito era o quadro do funil, cujas colunas não encolhem, esticar a
        PÁGINA inteira: aparecia uma barra de rolagem horizontal no rodapé do
        navegador, passando por baixo da barra lateral, e o `overflow-x-auto`
        do próprio quadro nunca entrava em ação porque o pai crescia junto.

        Com `min-w-0` o main volta a caber na janela e cada bloco largo (quadro,
        tabela) rola dentro do próprio contêiner, que é onde a rolagem faz
        sentido.
      */}
      {/*
        O painel de papel encaixado na moldura nanquim (direção visual 02).
        A rolagem continua sendo a da janela: o menu lateral é fixo, e trocar
        o contêiner de rolagem quebraria o que já mede a posição na página.
      */}
      <main className="relative w-full min-w-0 bg-papel px-8 pb-12 max-lg:px-0 max-lg:pb-0 md:my-2 md:mr-2 md:min-h-[calc(100svh-16px)] md:rounded-[14px]">
        {children}
      </main>
    </SidebarProvider>
  )
}

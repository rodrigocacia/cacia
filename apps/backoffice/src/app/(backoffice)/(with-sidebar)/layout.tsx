import { PropsWithChildren } from "react";

import { redirect } from "next/navigation";

import { getCurrentUser, isAuthenticated } from "@/auth/auth";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const autheticated = await isAuthenticated();

  if (!autheticated) {
    redirect("/signin");
  }

  const usuario = (await getCurrentUser()) as {
    name?: string;
    email?: string;
  } | null;

  return (
    <SidebarProvider className="bg-ink">
      <AppSidebar
        usuario={usuario ? { name: usuario.name, email: usuario.email } : null}
      />

      {/*
        O painel de papel encaixado na moldura nanquim (direção visual 02).
        `min-w-0` impede que uma tabela larga estique a página inteira: ela
        rola dentro do próprio contêiner.
      */}
      <main className="relative w-full min-w-0 bg-papel px-8 pb-12 max-lg:px-4 max-lg:pb-8 md:my-2 md:mr-2 md:min-h-[calc(100svh-16px)] md:rounded-[14px]">
        {children}
      </main>
    </SidebarProvider>
  );
}

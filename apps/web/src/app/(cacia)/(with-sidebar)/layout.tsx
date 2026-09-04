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
    <SidebarProvider>
      <AppSidebar />

      <main className="px-8 w-full pb-12 max-lg:pb-0 pt-8 bg-[#FCFCFD] lg:px-8 max-lg:px-0 max-lg:pt-0">
        {children}
      </main>
    </SidebarProvider>
  )
}

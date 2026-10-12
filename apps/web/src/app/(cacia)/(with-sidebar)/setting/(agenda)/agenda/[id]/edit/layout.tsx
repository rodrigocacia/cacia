import { PropsWithChildren } from "react"

import { Header } from "@/components/header"
import { Sidebar } from "./sidebar"

export default function AgendaLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex w-full flex-col pb-12 max-lg:px-4">
      <Header title="Configurações" />

      <Sidebar />

      <main className="mt-8 flex w-full max-w-[920px] flex-col gap-6 max-md:mt-6">
        {children}
      </main>
    </div>
  )
}

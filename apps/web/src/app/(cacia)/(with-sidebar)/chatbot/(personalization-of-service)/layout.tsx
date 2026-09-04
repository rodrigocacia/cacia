import { Header } from "@/components/header"
import { Sidebar } from "./sidebar"

import { PropsWithChildren } from "react"

export default function PersonalizationServiceLayout({
  children,
}: PropsWithChildren) {
  return (
    <div className="w-full flex flex-col max-lg:mt-0">
      <div className="max-lg:hidden">
        <Header title="I.A. Atendimento" />
      </div>

      <div className="w-full min-h-screen lg:grid lg:grid-cols-app mt-8 max-lg:mt-0">
        <Sidebar />

        <main className="px-4 pb-12 lg:col-start-2 max-lg:px-0">
          {children}
        </main>
      </div>
    </div>
  )
}

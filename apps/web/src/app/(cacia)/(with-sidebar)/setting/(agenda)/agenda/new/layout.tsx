import { PropsWithChildren } from "react"

import { Header } from "@/components/header"
import { Sidebar } from "./sidebar"

export default function ProfileLayout({ children }: PropsWithChildren) {
  return (
    <div className="w-full h-fit flex flex-col">
      <div className="max-md:hidden">
        <Header title="Configurações" />
      </div>

      <div className=" md:grid md:grid-cols-app mt-8 max-md:mt-0">
        <Sidebar />

        <main className="px-4 pb-12 max-md:px-0 lg:col-start-2 max-md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}

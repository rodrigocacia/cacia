import { Header } from "@/components/header"
import { PageHeader } from "@/components/ui/page-header"

import { Sidebar } from "./sidebar"

export default function NotificationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex w-full flex-col pb-12 max-lg:px-4">
      <Header title="Notificações" />

      <PageHeader
        title="Notificações"
        description="Documentos para conferir, compromissos novos e o andamento dos processos."
      />

      <div className="mt-8 grid gap-8 max-md:mt-6 max-md:gap-6 md:grid-cols-[216px_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0 md:sticky md:top-[76px] md:self-start">
          <Sidebar />
        </aside>

        <main className="flex min-w-0 flex-col gap-6">{children}</main>
      </div>
    </div>
  )
}

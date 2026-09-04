import { Header } from "@/components/header"
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb"

import { Sidebar } from "./sidebar"
import { notificationCrumbs } from "@/constants/breadcrumbs"
import { HeaderToGoBack } from "@/components/header-to-go-back"

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full h-fit flex flex-col">
      <div className="max-md:hidden">
        <Header title="Notificações" />

        <Breadcrumbs crumbs={notificationCrumbs} />
      </div>

      <div className="md:hidden">
        <HeaderToGoBack
          link="/customer"
          image={"bg-[url('/bg-login.png')] bg-cover bg-center"}
        />
      </div>

      <div className="w-full grid grid-cols-app max-md:grid-cols-1 mt-8 max-md:mt-0">
        <Sidebar />

        <main className="px-4 pb-12 max-md:px-0 lg:col-start-2 max-md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}

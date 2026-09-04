import { PropsWithChildren } from "react"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { getCustomerById } from "@/http/customer/get-customer-by-id"

import { Header } from "@/components/header"
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb"

import { Sidebar } from "./sidebar"
import { customerDetailsCrumbs } from "@/constants/breadcrumbs"
import { HeaderToGoBack } from "@/components/header-to-go-back"

export default async function ProfileLayout({
  children,
  params,
}: PropsWithChildren<{ params: Promise<{ id: string }> }>) {
  const { id: customerId } = await params

  const customer = await getCustomerById(customerId)

  let formattedCreatedAtDate = null

  if (customer?.created_at !== null) {
    formattedCreatedAtDate = format(
      new Date(customer?.created_at),
      "MMMM, yyyy",
      {
        locale: ptBR,
      }
    )
  }

  return (
    <div className="w-full h-fit flex flex-col">
      <div className="max-md:hidden">
        <Header title="Clientes" name={customer?.name ?? ""} />

        <Breadcrumbs
          crumbs={customerDetailsCrumbs(customer?._id, customer?.name)}
        />
      </div>

      <div className="md:hidden">
        <HeaderToGoBack link="/customer" bgColor="#ECF7F8" />
      </div>

      <div className="w-full grid grid-cols-app max-md:grid-cols-1 mt-8 max-md:mt-0">
        <Sidebar
          name={customer?.name}
          createdAt={formattedCreatedAtDate ?? "-"}
        />

        <main className="px-4 pb-12 max-md:px-0 lg:col-start-2 max-md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}

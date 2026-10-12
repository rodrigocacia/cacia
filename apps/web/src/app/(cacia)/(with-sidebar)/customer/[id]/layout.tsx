import { PropsWithChildren } from "react"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { getCustomerById } from "@/http/customer/get-customer-by-id"

import { Header } from "@/components/header"

import { CabecalhoDoCliente } from "./cabecalho"

export default async function ProfileLayout({
  children,
  params,
}: PropsWithChildren<{ params: Promise<{ id: string }> }>) {
  const { id: customerId } = await params

  const customer = await getCustomerById(customerId)

  let formattedCreatedAtDate = null

  if (customer?.created_at) {
    formattedCreatedAtDate = format(
      new Date(customer?.created_at),
      "MMMM 'de' yyyy",
      {
        locale: ptBR,
      }
    )
  }

  return (
    <div className="flex h-fit w-full flex-col max-lg:px-4">
      <Header title="Clientes" name={customer?.name ?? ""} />

      <CabecalhoDoCliente
        name={customer?.name ?? ""}
        createdAt={formattedCreatedAtDate}
        document={customer?.document}
        phone={customer?.remotejid}
      />

      <main className="w-full pt-5 pb-12">{children}</main>
    </div>
  )
}

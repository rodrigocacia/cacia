"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { ArrowLeft } from "lucide-react"

import { CustomTab } from "@/components/ui/custom-tab"
import { iniciaisDe } from "@/components/tables/iniciais"
import { formatDocument, formatPhone } from "@/utils/formatters"

import { tabs } from "./components/tabs"
import { ButtonEditCustomer } from "./components/button-edit-customer"
import { DialogDeleteCustomer } from "./components/dialog-delete-customer"
import { DialogEditCustomer } from "./components/dialog-edit-customer"

/**
 * Cabeçalho da ficha do cliente, no molde da ficha do lead: nome em serifa,
 * uma linha de contexto, as ações à direita e as seções em abas sublinhadas.
 */
export function CabecalhoDoCliente({
  name,
  createdAt,
  document,
  phone,
}: {
  name: string
  createdAt: string | null
  document?: string
  phone?: string
}) {
  const params = useParams()
  const customerId = String(params.id)

  const meta = [
    createdAt ? `Cliente desde ${createdAt}` : null,
    document ? formatDocument(document) : null,
    phone ? formatPhone(phone) : null,
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/customer"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] text-tinta-3 transition hover:text-tinta"
      >
        <ArrowLeft size={14} />
        Clientes
      </Link>

      <div className="flex flex-wrap items-end gap-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-nevoa font-display text-[28px] text-turquesa-profundo max-md:h-12 max-md:w-12 max-md:text-[22px]">
          {iniciaisDe(name)[0] ?? "?"}
        </span>

        <div className="flex min-w-0 flex-grow flex-col gap-1.5">
          <h1 className="font-display text-[40px] leading-none text-tinta max-md:text-[30px]">
            {name}
          </h1>
          {meta.length > 0 && (
            <p className="tabular text-[13.5px] text-tinta-2">
              {meta.join(" · ")}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <ButtonEditCustomer customerId={customerId} />
          <DialogDeleteCustomer name={name} />
        </div>
      </div>

      <CustomTab tabs={tabs(customerId)} />

      <DialogEditCustomer />
    </div>
  )
}

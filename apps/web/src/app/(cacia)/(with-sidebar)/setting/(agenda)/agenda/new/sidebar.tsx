"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { PageHeader } from "@/components/ui/page-header"

/** Cabeçalho da nova agenda: volta às agendas e o nome conforme é digitado. */
export function Sidebar() {
  const searchParams = useSearchParams()

  const name = searchParams.get("name")

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/setting/agenda"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] text-tinta-3 transition hover:text-tinta"
      >
        <ArrowLeft size={14} />
        Voltar às agendas
      </Link>

      <PageHeader
        eyebrow={name?.trim() ? "Nova agenda" : undefined}
        title={name?.trim() ? name : "Nova agenda"}
        description="Defina quando o assistente pode oferecer horários aos clientes."
      />
    </div>
  )
}

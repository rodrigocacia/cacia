"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { PageHeader } from "@/components/ui/page-header"

import { DialogDeleteCalendar } from "../components/dialog-delete-calendar"

/** Cabeçalho da edição: volta às agendas, nome da agenda e a exclusão. */
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
        eyebrow="Agenda"
        title={name ?? "Agenda"}
        description="Ajuste os dados e os horários em que o assistente pode marcar."
        action={<DialogDeleteCalendar name={name ?? ""} />}
      />
    </div>
  )
}

"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"

import { EmptySearch } from "@/components/empty-search"
import { useCalendar } from "@/http/hooks/calendar"
import { Spinner } from "@/components/ui/sppiner"

import { Cartao } from "../../_ui/cartao"
import { CardAgenda } from "./components/card-agenda"

export function AgendaDetail() {
  const params = useSearchParams()

  const page = params.get("page")

  const { calendar, isLoading } = useCalendar({ page: Number(page ?? 1) })

  if (isLoading) {
    return (
      <Cartao titulo="Agendas">
        <Spinner />
      </Cartao>
    )
  }

  return (
    <Cartao
      titulo={
        <span className="flex items-baseline gap-2">
          Agendas
          <span className="font-mono text-xs font-normal text-tinta-3 tabular">
            {calendar?.length}
          </span>
        </span>
      }
      descricao="Os horários em que o assistente pode marcar consultas e compromissos."
      acao={
        <Link
          href="/setting/agenda/new"
          className="inline-flex h-9 items-center gap-2 rounded-[9px] bg-acao px-3.5 text-[13.5px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-acao-escura"
        >
          <Plus size={15} strokeWidth={2} aria-hidden />
          Nova agenda
        </Link>
      }
      semRecuo
    >
      {calendar.length === 0 ? (
        <div className="p-7 max-md:p-5">
          <EmptySearch title="Sem agendas cadastradas" subtitle="" />
        </div>
      ) : (
        <ul className="flex flex-col">
          {calendar.map((agenda) => (
            <CardAgenda key={agenda._id} agenda={agenda} />
          ))}
        </ul>
      )}
    </Cartao>
  )
}

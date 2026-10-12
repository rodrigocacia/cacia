import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import ReactMarkdown from "react-markdown"

import { Pencil, Scale, Trash2, User, X } from "lucide-react"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Spinner } from "@/components/ui/sppiner"

import { useEventById } from "@/http/hooks/event"

import { TypeEvent } from "./type-event"
import { StatusEvent } from "./status-event"
import { BotaoCancelarEvento } from "../button-cancel-event"

import { formatProcess } from "@/utils/formatters"

import { ehPrazo, ROTULO_DO_TIPO } from "../estilo-do-evento"

const PAINEL =
  "w-[320px] shrink-0 border-l border-filete bg-white p-5 max-xl:w-[280px]"

export function EventDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const eventId = searchParams.get("eventId")

  const { event, isError, isLoading } = useEventById(eventId ?? "")

  if (isLoading) {
    return (
      <div className={PAINEL}>
        <Spinner />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={PAINEL}>
        <p className="text-[13px] text-tinta-3">Erro ao carregar evento</p>
      </div>
    )
  }

  function handleSelectEvent() {
    const params = new URLSearchParams(searchParams)
    params.delete("eventId")
    router.push(`?${params.toString()}`)
  }

  function handleEditEvent() {
    const params = new URLSearchParams(searchParams)
    params.set("editEventId", eventId ?? "")
    router.push(`?${params.toString()}`)
  }

  function handleDeleteEvent() {
    const params = new URLSearchParams(searchParams)
    params.set("deleteEventId", eventId ?? "")
    router.push(`?${params.toString()}`)
  }

  const vinculo =
    "flex items-center gap-2.5 rounded-[10px] border border-filete bg-white px-3 py-2 text-[13px] text-tinta transition-colors hover:bg-papel"

  return (
    <div className={PAINEL}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            {event?.type && (
              <span
                className={
                  ehPrazo(event.type)
                    ? "font-mono text-[10.5px] tracking-[0.08em] text-ambar uppercase"
                    : "rotulo"
                }
              >
                {ROTULO_DO_TIPO[event.type] ?? event.type}
              </span>
            )}
            <h2 className="font-display text-[26px] leading-[1.1] break-words text-tinta">
              {event?.title}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Fechar detalhes do evento"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-tinta-3 transition-colors hover:bg-gray-100 hover:text-tinta"
            onClick={handleSelectEvent}
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <p className="tabular text-[13.5px] text-tinta-2">
          {event?.start_time &&
            format(event?.start_time, "EEEE, d 'de' MMMM", {
              locale: ptBR,
            })}
          <br />
          {event?.custom_start_time}–{event?.custom_end_time}
        </p>

        <dl className="flex flex-col">
          {event?.status && (
            <Linha rotulo="Status">
              <StatusEvent status={event?.status} />
            </Linha>
          )}
          {event?.type && (
            <Linha rotulo="Tipo">
              <TypeEvent type={event?.type} />
            </Linha>
          )}
          <Linha rotulo="Agenda">
            {event?.calendar?.title || "Agenda não definida"}
          </Linha>
        </dl>

        {(event?.lead || event?.customer || event?.process) && (
          <div className="flex flex-col gap-1.5">
            <span className="rotulo">Vínculos</span>

            {event?.lead && !event?.customer && (
              <Link
                href={`/lead/?lead_id=${event?.lead?._id}`}
                className={vinculo}
              >
                <User size={15} strokeWidth={1.7} className="text-tinta-3" />
                <span className="truncate">
                  {event?.lead?.name || "Lead sem nome"}
                </span>
              </Link>
            )}

            {event?.customer && (
              <Link
                href={`/customer/${event?.customer?._id}/personal-information`}
                className={vinculo}
              >
                <User size={15} strokeWidth={1.7} className="text-tinta-3" />
                <span className="truncate">
                  {event?.customer?.name || "Cliente sem nome"}
                </span>
              </Link>
            )}

            {event?.process && (
              <Link
                href={`/process/${event?.process?._id}/information`}
                className={vinculo}
              >
                <Scale size={15} strokeWidth={1.7} className="text-tinta-3" />
                <span className="tabular truncate">
                  {formatProcess(event?.process?.number)}
                </span>
              </Link>
            )}
          </div>
        )}

        {event?.description && (
          <div className="flex flex-col gap-1.5">
            <span className="rotulo">Detalhes</span>

            <div className="text-[13.5px] leading-[1.5] text-tinta-2">
              <ReactMarkdown>
                {event?.description || "Nenhuma descrição"}
              </ReactMarkdown>
            </div>
          </div>
        )}

        <div className="flex w-full flex-wrap items-center gap-2 border-t border-filete pt-4">
          <button
            type="button"
            onClick={handleEditEvent}
            className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-filete-forte bg-white px-3 text-[13px] font-medium text-tinta transition-colors hover:bg-gray-100"
          >
            <Pencil size={14} strokeWidth={1.7} />
            Editar
          </button>

          <button
            type="button"
            onClick={handleDeleteEvent}
            className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-filete-forte bg-white px-3 text-[13px] font-medium text-tinta transition-colors hover:border-[#F3D5CF] hover:bg-[#FBEDEA] hover:text-[#A23B2A]"
          >
            <Trash2 size={14} strokeWidth={1.7} />
            Excluir
          </button>

          {eventId && (
            <BotaoCancelarEvento eventId={eventId} status={event?.status} />
          )}
        </div>
      </div>
    </div>
  )
}

function Linha({
  rotulo,
  children,
}: {
  rotulo: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[40px] items-center justify-between gap-3 border-b border-[#F1EEE8] py-1.5 text-[13px] first:border-t">
      <dt className="text-tinta-3">{rotulo}</dt>
      <dd className="min-w-0 truncate font-medium text-tinta">{children}</dd>
    </div>
  )
}

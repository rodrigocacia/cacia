import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import ReactMarkdown from "react-markdown"

import { Icon } from "@/components/icone"

import { ClockIcon } from "lucide-react"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatName } from "@/utils/formatters"

import { Spinner } from "@/components/ui/sppiner"

import { useEventById } from "@/http/hooks/event"

import { TypeEvent } from "./type-event"
import { StatusEvent } from "./status-event"
import { BotaoCancelarEvento } from "../button-cancel-event"

import { formatProcess } from "@/utils/formatters"

export function EventDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const eventId = searchParams.get("eventId")

  const { event, isError, isLoading } = useEventById(eventId ?? "")

  if (isLoading) {
    return (
      <div className="w-[300px] bg-[#FAFAFA] border-l border-[#E0E0E0] p-4">
        <Spinner />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-[300px] bg-[#FAFAFA] border-l border-[#E0E0E0] p-4">
        <p className="text-sm text-[#BDBDBD] font-semibold">
          Erro ao carregar evento
        </p>
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

  return (
    <div className="w-[300px] bg-[#FAFAFA] border-l border-[#E0E0E0] p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[2rem] text-[#707070] leading-none font-semibold">
            {event?.title}
          </h2>

          <button
            className="cursor-pointer bg-gray-200 rounded-md p-1"
            onClick={handleSelectEvent}
          >
            <Icon icon="mdi:close" className="w-6 h-6" />
          </button>
        </div>

        {event?.status && (
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-[#BDBDBD] font-semibold">Status</p>

            <StatusEvent status={event?.status} />
          </div>
        )}

        <div className="flex items-center justify-between text-[#9E9E9E] text-sm">
          <span className="text-[#BDBDBD] font-semibold">
            {event?.start_time &&
              format(event?.start_time, "d 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
          </span>

          <span className="flex items-center gap-1 text-[#BDBDBD]">
            <ClockIcon className="w-4 h-4" />
            {event?.custom_start_time} - {event?.custom_end_time}
          </span>
        </div>

        {event?.lead && !event?.customer && (
          <Link
            href={`/lead/?lead_id=${event?.lead?._id}`}
            className="flex items-center gap-2 p-2 bg-[#FAFAFA] rounded border text-[#666]"
          >
            <Icon icon="mdi:account-outline" className="w-4 h-4" />
            <span className="text-[#707070]">
              {formatName(event?.lead?.name) || "Lead sem nome"}
            </span>
          </Link>
        )}

        {event?.customer && (
          <Link
            href={`/customer/${event?.customer?._id}/personal-information`}
            className="flex items-center gap-2 p-2 bg-[#FAFAFA] rounded border text-[#666]"
          >
            <Icon icon="mdi:account-outline" className="w-4 h-4" />
            <span className="text-[#707070]">
              {formatName(event?.customer?.name) || "Cliente sem nome"}
            </span>
          </Link>
        )}

        {event?.process && (
          <Link
            href={`/process/${event?.process?._id}/information`}
            className="flex flex-col gap-1 p-2 bg-[#FAFAFA] rounded border text-[#666]"
          >
            <div className="flex items-center gap-2">
              <Icon icon="mdi:folder-text-outline" className="w-4 h-4" />
              <span className="text-[#707070]">Processo</span>
            </div>
            <span className="text-[#707070]">
              {formatProcess(event?.process?.number)}
            </span>
          </Link>
        )}

        {event?.type && (
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-[#BDBDBD] font-semibold">
              Tipo de evento
            </p>

            <TypeEvent type={event?.type} />
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-[#BDBDBD] font-semibold">Agenda</p>

          <span className="inline-flex items-center gap-2 text-[#555] font-medium">
            {event?.calendar?.title || "Agenda não definida"}
          </span>
        </div>

        {event?.description && (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-[#BDBDBD] font-semibold">Detalhes</p>

            <div className="text-sm text-[#555] font-medium">
              <ReactMarkdown>
                {event?.description || "Nenhuma descrição"}
              </ReactMarkdown>
            </div>
          </div>
        )}

        <div className="w-full flex flex-wrap items-center justify-start gap-2 mt-2">
          <button
            type="button"
            onClick={handleEditEvent}
            className="cursor-pointer bg-transparent border border-gray-200 text-[#333] flex items-center justify-center gap-2 px-4 py-2 rounded-md"
          >
            <Icon icon="mdi:pencil" className="w-4 h-4 text-[#333]" />
            Editar
          </button>

          <button
            type="button"
            onClick={handleDeleteEvent}
            className="cursor-pointer bg-transparent border border-red-200 text-[#DC2626] flex items-center justify-center gap-2 px-4 py-2 rounded-md"
          >
            <Icon icon="mdi:trash-can" className="w-4 h-4 text-[#DC2626]" />
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

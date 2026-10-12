"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Icon } from "@/components/icone"
import { ClockIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatProcess } from "@/utils/formatters"

import { Spinner } from "@/components/ui/sppiner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useEventById } from "@/http/hooks/event"
import { TypeEvent } from "./type-event"
import { StatusEvent } from "./status-event"
import { BotaoCancelarEvento } from "../button-cancel-event"
import { useCallback } from "react"
import Link from "next/link"

export function DialogShowEvent() {
  const router = useRouter()

  const pathname = usePathname()
  const searchParams = useSearchParams()

  const eventShowId = searchParams.get("eventShowId")

  const { event, isError, isLoading } = useEventById(eventShowId ?? "")

  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    params.delete("eventShowId")
    router.replace(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  if (!eventShowId || eventShowId.trim() === "") {
    return null
  }

  return (
    <Dialog
      open={!!eventShowId}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose()
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left font-display text-[26px] font-normal">
            {isLoading ? "Carregando..." : event?.title || "Detalhes do Evento"}
          </DialogTitle>
        </DialogHeader>

        {isLoading && eventShowId && (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        )}

        {isError && eventShowId && (
          <div className="flex items-center justify-center py-8">
            <p className="text-[13px] text-[#A23B2A]">
              Erro ao carregar evento
            </p>
          </div>
        )}

        {!isLoading && !isError && event && eventShowId && (
          <div className="flex flex-col gap-4">
            {event.status && (
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-tinta-3">Status</p>
                <StatusEvent status={event.status} />
              </div>
            )}

            <div className="tabular flex items-center justify-between text-[13.5px] text-tinta-2">
              <span className="font-medium text-tinta">
                {event.start_time &&
                  format(event.start_time, "d 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
              </span>

              <span className="flex items-center gap-1 text-tinta-2">
                <ClockIcon className="w-4 h-4" />
                {event.start_time && format(event.start_time, "HH:mm")} -{" "}
                {event.end_time && format(event.end_time, "HH:mm")}
              </span>
            </div>

            {event.lead && (
              <div className="flex items-center gap-2 rounded-[10px] border border-filete bg-white px-3 py-2 text-[13px]">
                <Icon
                  icon="mdi:account-outline"
                  className="h-4 w-4 text-tinta-3"
                />
                <span className="text-tinta">
                  {event.lead.name || "Lead sem nome"}
                </span>
              </div>
            )}

            {event.customer && (
              <div className="flex items-center gap-2 rounded-[10px] border border-filete bg-white px-3 py-2 text-[13px]">
                <Icon
                  icon="mdi:account-outline"
                  className="h-4 w-4 text-tinta-3"
                />
                <span className="text-tinta">
                  {event.customer.name || "Cliente sem nome"}
                </span>
              </div>
            )}

            {event.process && (
              <div className="flex flex-col gap-1 rounded-[10px] border border-filete bg-white px-3 py-2 text-[13px]">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="mdi:folder-text-outline"
                    className="h-4 w-4 text-tinta-3"
                  />
                  <span className="text-tinta">Processo</span>
                </div>
                <span className="text-tinta">
                  {formatProcess(event.process.number)}
                </span>
              </div>
            )}

            {event.type && (
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-tinta-3">Tipo de evento</p>
                <TypeEvent type={event.type} />
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-[13px] text-tinta-3">Agenda</p>
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-tinta">
                {event.calendar?.title || "Agenda não definida"}
              </span>
            </div>

            {event.description && (
              <div className="flex flex-col gap-2">
                <p className="text-[13px] text-tinta-3">Detalhes</p>
                <div className="rounded-[10px] border border-filete bg-papel p-3 text-[13.5px] text-tinta-2">
                  {event.description}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-filete pt-4">
              <div className="flex items-center gap-2">
                {event.customer && (
                  <Link
                    href={`/customer/${event.customer._id}/personal-information`}
                    className="flex h-9 items-center rounded-[9px] border border-filete-forte bg-white px-3 text-[13px] font-medium text-tinta transition-colors hover:bg-gray-100"
                  >
                    Cliente
                  </Link>
                )}

                {event.process && (
                  <Link
                    href={`/process/${event.process._id}/information`}
                    className="flex h-9 items-center rounded-[9px] border border-filete-forte bg-white px-3 text-[13px] font-medium text-tinta transition-colors hover:bg-gray-100"
                  >
                    Processo
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <BotaoCancelarEvento
                  eventId={eventShowId}
                  status={event.status}
                />

                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams)
                    params.set("deleteEventId", eventShowId ?? "")
                    router.replace(`${pathname}?${params.toString()}`)
                  }}
                  className="flex h-9 cursor-pointer items-center rounded-[9px] border border-filete-forte bg-white px-3 text-[13px] font-medium text-tinta transition-colors hover:border-[#F3D5CF] hover:bg-[#FBEDEA] hover:text-[#A23B2A]"
                >
                  Excluir
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-9 cursor-pointer items-center rounded-[9px] border border-filete-forte bg-white px-3 text-[13px] font-medium text-tinta transition-colors hover:bg-gray-100"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

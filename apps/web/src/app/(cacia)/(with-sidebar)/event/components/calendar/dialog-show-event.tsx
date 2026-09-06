"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Icon } from "@/components/icone"
import { ClockIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatName } from "@/utils/formatters"
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
          <DialogTitle className="text-left">
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
            <p className="text-sm text-red-500 font-semibold">
              Erro ao carregar evento
            </p>
          </div>
        )}

        {!isLoading && !isError && event && eventShowId && (
          <div className="flex flex-col gap-4">
            {event.status && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 font-semibold">Status</p>
                <StatusEvent status={event.status} />
              </div>
            )}

            <div className="flex items-center justify-between text-gray-600 text-sm">
              <span className="text-gray-600 font-semibold">
                {event.start_time &&
                  format(event.start_time, "d 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
              </span>

              <span className="flex items-center gap-1 text-gray-600">
                <ClockIcon className="w-4 h-4" />
                {event.start_time && format(event.start_time, "HH:mm")} -{" "}
                {event.end_time && format(event.end_time, "HH:mm")}
              </span>
            </div>

            {event.lead && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                <Icon
                  icon="mdi:account-outline"
                  className="w-4 h-4 text-gray-600"
                />
                <span className="text-gray-700">
                  {formatName(event.lead.name) || "Lead sem nome"}
                </span>
              </div>
            )}

            {event.customer && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                <Icon
                  icon="mdi:account-outline"
                  className="w-4 h-4 text-gray-600"
                />
                <span className="text-gray-700">
                  {formatName(event.customer.name) || "Cliente sem nome"}
                </span>
              </div>
            )}

            {event.process && (
              <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded border">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="mdi:folder-text-outline"
                    className="w-4 h-4 text-gray-600"
                  />
                  <span className="text-gray-700">Processo</span>
                </div>
                <span className="text-gray-700">
                  {formatProcess(event.process.number)}
                </span>
              </div>
            )}

            {event.type && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 font-semibold">
                  Tipo de evento
                </p>
                <TypeEvent type={event.type} />
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 font-semibold">Agenda</p>
              <span className="inline-flex items-center gap-2 text-gray-700 font-medium">
                {event.calendar?.title || "Agenda não definida"}
              </span>
            </div>

            {event.description && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600 font-semibold">Detalhes</p>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                  {event.description}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                {event.customer && (
                  <Link
                    href={`/customer/${event.customer._id}/information`}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cliente
                  </Link>
                )}

                {event.process && (
                  <Link
                    href={`/process/${event.process._id}/information`}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Processo
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams)
                    params.set("deleteEventId", eventShowId ?? "")
                    router.replace(`${pathname}?${params.toString()}`)
                  }}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                >
                  Excluir
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Icon } from "@/components/icone"
import { Toast } from "@/components/ui/toast"

import { cancelEvent } from "@/http/event/cancel-event"
import { useEventById } from "@/http/hooks/event"
import { EventStatus } from "@/types/event"

interface BotaoCancelarEventoProps {
  eventId: string
  status?: EventStatus
}

/**
 * "Cancelar compromisso", com confirmação no segundo clique.
 *
 * A confirmação existe porque o cancelamento também cancela os lembretes e não
 * tem volta pela tela — um clique distraído não pode bastar.
 */
export function BotaoCancelarEvento({
  eventId,
  status,
}: BotaoCancelarEventoProps) {
  const router = useRouter()
  const { mutate } = useEventById(eventId)

  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")
  const [cancelado, setCancelado] = useState(false)

  async function cancelar() {
    if (!confirmando) {
      setConfirmando(true)
      return
    }

    setEnviando(true)
    const resultado = await cancelEvent(eventId)
    setEnviando(false)
    setConfirmando(false)

    if (!resultado.success) {
      setErro(resultado.error)
      return
    }

    setCancelado(true)
    await mutate()
    router.refresh()
  }

  return (
    <>
      {status !== EventStatus.CANCEL && (
        <button
          type="button"
          onClick={cancelar}
          disabled={enviando}
          className="cursor-pointer bg-transparent border border-amber-300 text-amber-700 flex items-center justify-center gap-2 px-4 py-2 rounded-md disabled:opacity-60"
        >
          <Icon icon="mdi:close" className="w-4 h-4" />
          {confirmando ? "Confirmar cancelamento" : "Cancelar compromisso"}
        </button>
      )}

      {erro && (
        <Toast
          onClose={() => setErro("")}
          variant="errorSolid"
          title="Erro ao cancelar compromisso"
          description={erro}
        />
      )}

      {cancelado && (
        <Toast
          onClose={() => setCancelado(false)}
          variant="successSolid"
          title="Compromisso cancelado"
          description="Os lembretes pendentes também foram cancelados."
        />
      )}
    </>
  )
}

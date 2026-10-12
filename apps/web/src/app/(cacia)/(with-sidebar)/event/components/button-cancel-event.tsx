"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { X } from "lucide-react"
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
          className={`flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[9px] border px-3 text-[13px] font-medium transition-colors disabled:opacity-60 ${
            confirmando
              ? "border-ambar-ponto bg-ambar-fundo text-ambar"
              : "border-filete-forte bg-white text-tinta hover:bg-ambar-fundo hover:text-ambar"
          }`}
        >
          <X size={14} strokeWidth={1.7} />
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

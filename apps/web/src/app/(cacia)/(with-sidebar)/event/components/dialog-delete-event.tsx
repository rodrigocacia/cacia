"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/custom-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Icon } from "@/components/icone"
import { Toast } from "@/components/ui/toast"
import { deleteEvent } from "@/http/event/delete-event"

export function DialogDeleteEvent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const deleteEventId = searchParams.get("deleteEventId")

  useEffect(() => {
    if (deleteEventId) setIsOpen(true)
    if (!deleteEventId) setIsOpen(false)
  }, [deleteEventId])

  const onClose = () => {
    const params = new URLSearchParams(searchParams)
    params.delete("deleteEventId")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!deleteEventId) return

    try {
      setIsLoading(true)

      const result = await deleteEvent(deleteEventId)

      if (!result.success) {
        setHasError(true)
        setErrorMessage(result.error ?? "Erro ao excluir evento")
        return
      }

      setIsSuccess(true)
      setIsOpen(false)

      const params = new URLSearchParams(searchParams)
      params.delete("eventId")
      params.delete("eventShowId")
      params.delete("editEventId")
      params.delete("newEvent")
      params.delete("deleteEventId")
      router.push(`${pathname}?${params.toString()}`)
    } catch {
      setHasError(true)
      setErrorMessage("Erro inesperado ao excluir evento")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="px-[30px]">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Deseja mesmo excluir o evento?
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col items-center"
          >
            <div className="w-[100px] h-[100px] flex items-center justify-center rounded-full bg-[#F6F6F9]">
              <Icon
                icon="mdi:help-circle"
                className="w-[56px] h-[56px] text-[#BDBDBD]"
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-3.5 mt-[30px]">
              <h4 className="text-xl text-center text-[#33454C] font-semibold">
                Deseja mesmo excluir o evento?
              </h4>
              <p className="text-[18px] leading-[24px] text-[#4D5D63] text-center">
                Caso prossiga com esta solicitação, todos os dados do evento
                serão perdidos, e essa ação não poderá ser desfeita.
              </p>
            </div>

            <div className="w-full flex items-center justify-center gap-3.5 mt-[34px]">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button variant="danger" type="submit" disabled={isLoading}>
                {isLoading ? "Excluindo..." : "Excluir mesmo assim"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao excluir evento!"
          description={errorMessage}
        />
      )}

      {isSuccess && (
        <Toast
          onClose={() => setIsSuccess(false)}
          variant="successSolid"
          title="Evento excluído com sucesso!"
          description="O evento foi excluído com sucesso."
        />
      )}
    </>
  )
}

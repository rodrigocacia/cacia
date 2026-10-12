"use client"

import { useState } from "react"
import { Button } from "./custom-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"
import { Trash2 } from "lucide-react"
import { deleteReminder } from "@/http/reminder/delete-reminder"

interface DialogDeleteReminderProps {
  reminderId: string
  reminderLabel: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export function DialogDeleteReminder({
  reminderId,
  reminderLabel,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: DialogDeleteReminderProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsLoading(true)

    try {
      const result = await deleteReminder(reminderId)

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        onError(
          typeof result.error === "string"
            ? result.error
            : "Erro ao excluir lembrete"
        )
      }
    } catch (error) {
      onError("Erro inesperado ao excluir lembrete")
      console.error("Erro inesperado:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Deseja mesmo excluir o lembrete?
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex w-full flex-col">
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FBEDEA] text-[#A23B2A]">
              <Trash2 size={18} strokeWidth={1.7} aria-hidden />
            </span>

            <div className="mt-4 flex flex-col gap-2">
              <h4 className="font-display text-[26px] leading-[1.15] text-tinta">
                Deseja mesmo excluir o lembrete {reminderLabel}?
              </h4>

              <p className="text-[14px] leading-relaxed text-tinta-2">
                Caso prossiga com esta solicitação, o lembrete será removido e
                essa ação não poderá ser desfeita.
              </p>
            </div>

            <div className="-mx-6 mt-6 flex items-center justify-end gap-2.5 border-t border-filete px-6 pt-4 max-sm:flex-col-reverse max-sm:items-stretch">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                isLoading={isLoading}
                disabled={isLoading}
                variant="danger"
              >
                {isLoading ? "Excluindo..." : "Excluir mesmo assim"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

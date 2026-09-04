"use client"

import { useState } from "react"
import { Button } from "./custom-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"
import { Icon } from "@iconify/react/dist/iconify.js"
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
        <DialogContent className="px-[30px]">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Deseja mesmo excluir o lembrete?
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
                Deseja mesmo excluir o lembrete {reminderLabel}?
              </h4>

              <p className="text-[18px] leading-[24px] text-[#4D5D63] text-center">
                Caso prossiga com esta solicitação, o lembrete será removido e
                essa ação não poderá ser desfeita.
              </p>
            </div>

            <div className="w-full flex items-center justify-center gap-3.5 mt-[34px]">
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

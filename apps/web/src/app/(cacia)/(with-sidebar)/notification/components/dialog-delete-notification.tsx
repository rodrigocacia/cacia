import { Button } from "@/components/ui/custom-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteNotification } from "@/http/notification/delete-notification"
import { useState } from "react"
import { useNotification } from "@/http/hooks/notification"
import { useSearchParams } from "next/navigation"
import { mensagemDeErro } from "@/utils/error-handlers"

interface DialogDeleteNotificationProps {
  id: string
  setIsSuccess: (isSuccess: boolean) => void
  setHasError: (hasError: boolean) => void
  setErrorMessage: (errorMessage: string) => void
  isOpen: boolean
  onClose: () => void
}

export function DialogDeleteNotification({
  id,
  setIsSuccess,
  setHasError,
  setErrorMessage,
  isOpen,
  onClose,
}: DialogDeleteNotificationProps) {
  const [isLoading, setIsLoading] = useState(false)

  const searchParams = useSearchParams()
  const page = Number(searchParams.get("page")) || 1

  const { mutate } = useNotification(page)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!id) return

    try {
      setIsLoading(true)

      const result = await deleteNotification(id)

      if (!result.success) {
        setHasError(true)
        setErrorMessage(mensagemDeErro(result.error))

        setIsLoading(false)

        return
      }

      setIsSuccess(true)

      setIsLoading(false)

      mutate()

      onClose()
    } catch (error) {
      setIsLoading(false)
      console.error(error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="px-[30px]">
        <DialogHeader>
          <DialogTitle className="text-left text-[17px] font-semibold text-tinta">
            Excluir a notificação?
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
          <p className="text-[14px] leading-relaxed text-tinta-2">
            Caso prossiga com esta solicitação, todos os dados serão perdidos e
            essa ação não poderá ser desfeita.
          </p>

          <div className="flex w-full items-center justify-end gap-2 max-md:flex-col-reverse max-md:items-stretch">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>

            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
              variant="danger"
            >
              Excluir mesmo assim
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

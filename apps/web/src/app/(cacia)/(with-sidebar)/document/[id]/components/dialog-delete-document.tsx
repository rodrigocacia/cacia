import { Button } from "@/components/ui/custom-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Icon } from "@/components/icone"
import { deleteDocument } from "@/http/document/delete-document"
import { useState } from "react"
import { mensagemDeErro } from "@/utils/error-handlers"

interface DialogDeleteDocumentProps {
  id: string
  name: string
  setIsSuccess: (isSuccess: boolean) => void
  setHasError: (hasError: boolean) => void
  setErrorMessage: (errorMessage: string) => void
  isOpen: boolean
  onClose: () => void
}

export function DialogDeleteDocument({
  id,
  name,
  setIsSuccess,
  setHasError,
  setErrorMessage,
  isOpen,
  onClose,
}: DialogDeleteDocumentProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!id) return

    try {
      setIsLoading(true)

      const result = await deleteDocument(id)

      if (!result.success) {
        setHasError(true)
        setErrorMessage(mensagemDeErro(result.error))

        setIsLoading(false)

        return
      }

      setIsSuccess(true)

      setIsLoading(false)

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
          <DialogTitle className="sr-only">Excluir documento</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FBEDEA]">
            <Icon
              icon="mdi:trash-can-outline"
              className="h-6 w-6 text-[#A23B2A]"
            />
          </div>

          <div className="mt-5 flex flex-col items-center justify-center gap-2">
            <h4 className="text-center font-display text-[26px] leading-tight text-tinta">
              Deseja mesmo excluir o documento {name}?
            </h4>

            <p className="text-center text-[14.5px] leading-[1.5] text-tinta-2">
              Caso prossiga com esta solicitação, todos os dados do documento
              serão perdidos, e essa ação não poderá ser desfeita.
            </p>
          </div>

          <div className="mt-7 flex w-full items-center justify-center gap-2.5">
            {/* type="button": sem ele o "Cancelar" enviava o formulário e
                excluía do mesmo jeito. */}
            <Button variant="outline" type="button" onClick={onClose}>
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

import { Button } from "@/components/ui/custom-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Icon } from "@iconify/react/dist/iconify.js"
import { deleteDocument } from "@/http/document/delete-document"
import { useState } from "react"

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
        setErrorMessage(JSON.stringify(result.error.message))

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
          <DialogTitle className="sr-only">
            Are you absolutely sure?
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
              Deseja mesmo excluir o documento {name}?
            </h4>

            <p className="text-[18px] leading-[24px] text-[#4D5D63] text-center">
              Caso prossiga com esta solicitação, todos os dados do documento
              serão perdidos, e essa ação não poderá ser desfeita.
            </p>
          </div>

          <div className="w-full flex items-center justify-center gap-3.5 mt-[34px]">
            <Button variant="outline">Cancelar</Button>

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

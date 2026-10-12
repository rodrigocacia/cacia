import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/custom-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Icon } from "@/components/icone"
import { useRouter } from "next/navigation"
import { deleteFolder } from "@/http/folder/delete-folder"
import { useState } from "react"
import { mensagemDeErro } from "@/utils/error-handlers"

interface DialogDeleteFolderProps {
  id: string
  name: string
  setIsSuccess: (isSuccess: boolean) => void
  setHasError: (hasError: boolean) => void
  setErrorMessage: (errorMessage: string) => void
}

export function DialogDeleteFolder({
  id,
  name,
  setIsSuccess,
  setHasError,
  setErrorMessage,
}: DialogDeleteFolderProps) {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!id) return

    try {
      setIsLoading(true)

      const result = await deleteFolder(id)

      if (!result.success) {
        setHasError(true)
        setErrorMessage(mensagemDeErro(result.error))

        setIsLoading(false)

        return
      }

      setIsSuccess(true)

      setIsLoading(false)

      router.replace("/document")
    } catch (error) {
      setIsLoading(false)
      console.error(error)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-9! cursor-pointer rounded-[9px]! px-3.5 text-[13.5px] font-medium hover:text-[#A23B2A]"
          variant="outline"
          iconLeft={<Trash2 size={15} strokeWidth={1.7} />}
        >
          Excluir pasta
        </Button>
      </DialogTrigger>

      <DialogContent className="px-[30px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Excluir pasta</DialogTitle>
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
              Deseja mesmo excluir a pasta {name}?
            </h4>

            <p className="text-center text-[14.5px] leading-[1.5] text-tinta-2">
              Caso prossiga com esta solicitação, todos os dados da pasta serão
              perdidos, e essa ação não poderá ser desfeita.
            </p>
          </div>

          <div className="mt-7 flex w-full items-center justify-center gap-2.5">
            {/* type="button": sem ele o "Cancelar" enviava o formulário e
                excluía do mesmo jeito. */}
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>

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

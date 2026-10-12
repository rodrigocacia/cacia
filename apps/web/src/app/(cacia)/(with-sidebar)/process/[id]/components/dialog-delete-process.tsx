"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/custom-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Icon } from "@/components/icone"
import { Toast } from "@/components/ui/toast"
import { useCustomers } from "@/http/hooks/customer"
import { deleteProcess } from "@/http/process/delete-process"
import { formatProcess } from "@/utils/formatters"

export function DialogDeleteProcess({ number }: { number: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const params = useParams()
  const processId = params.id as string

  const { mutate } = useCustomers({ page: 1 })

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const result = await deleteProcess(processId)

      if (result.success) {
        setIsSuccess(true)
        setIsOpen(false)

        await mutate()

        router.push("/process")
      } else {
        setHasError(true)
        setErrorMessage(
          typeof result.error === "string"
            ? result.error
            : "Erro ao excluir processo"
        )
      }
    } catch (error) {
      setHasError(true)
      setErrorMessage("Erro inesperado ao excluir processo")
      console.error("Erro inesperado:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="h-9! cursor-pointer rounded-[9px]! px-3.5 text-[13.5px] font-medium hover:text-[#A23B2A]"
            variant="outline"
            iconLeft={<Trash2 size={15} strokeWidth={1.7} />}
          >
            Excluir
          </Button>
        </DialogTrigger>

        <DialogContent className="px-[30px]">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Deseja mesmo excluir o processo?
            </DialogTitle>
          </DialogHeader>

          <div className="w-full flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FBEDEA]">
              <Icon
                icon="mdi:trash-can-outline"
                className="h-6 w-6 text-[#A23B2A]"
              />
            </div>

            <div className="mt-5 flex flex-col items-center justify-center gap-2">
              <h4 className="text-center font-display text-[26px] leading-tight text-tinta">
                Deseja mesmo excluir o processo
              </h4>
              <h4 className="text-center font-display text-[26px] leading-tight text-tinta">
                {formatProcess(number)}?
              </h4>

              <p className="text-center text-[14.5px] leading-[1.5] text-tinta-2">
                Caso prossiga com esta solicitação, todos os dados do processo
                serão perdidos, e essa ação não poderá ser desfeita.
              </p>
            </div>

            <div className="mt-7 flex w-full items-center justify-center gap-2.5">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>

              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? "Excluindo..." : "Excluir mesmo assim"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao excluir processo!"
          description={errorMessage}
        />
      )}

      {isSuccess && (
        <Toast
          onClose={() => setIsSuccess(false)}
          variant="successSolid"
          title="Processo excluído com sucesso!"
          description="O processo foi excluído com sucesso."
        />
      )}
    </>
  )
}

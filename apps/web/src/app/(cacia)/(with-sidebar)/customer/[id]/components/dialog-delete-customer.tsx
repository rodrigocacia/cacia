"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { FaTrash } from "react-icons/fa"

import { Button } from "@/components/ui/custom-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Icon } from "@/components/icone"
import { deleteCustomer } from "@/http/customer/delete-customer"
import { Toast } from "@/components/ui/toast"
import { useCustomers } from "@/http/hooks/customer"

export function DialogDeleteCustomer({ name }: { name: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const { mutate } = useCustomers({ page: 1 })

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const result = await deleteCustomer(customerId)

      if (result.success) {
        setIsSuccess(true)
        setIsOpen(false)

        await mutate()

        router.push("/customer")
      } else {
        setHasError(true)
        setErrorMessage(
          typeof result.error === "string"
            ? result.error
            : "Erro ao excluir cliente"
        )
      }
    } catch (error) {
      setHasError(true)
      setErrorMessage("Erro inesperado ao excluir cliente")
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
            className="cursor-pointer"
            variant="danger"
            iconLeft={<FaTrash size={14} className="text-[#DC2626]" />}
          >
            <span className="text-sm text-[#DC2626]">Excluir</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="px-[30px]">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Deseja mesmo excluir o cliente?
            </DialogTitle>
          </DialogHeader>

          <div className="w-full flex flex-col items-center">
            <div className="w-[100px] h-[100px] flex items-center justify-center rounded-full bg-[#F6F6F9]">
              <Icon
                icon="mdi:help-circle"
                className="w-[56px] h-[56px] text-[#BDBDBD]"
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-3.5 mt-[30px]">
              <h4 className="text-xl text-center text-[#33454C] font-semibold">
                Deseja mesmo excluir o cliente {name}?
              </h4>

              <p className="text-[18px] leading-[24px] text-[#4D5D63] text-center">
                Caso prossiga com esta solicitação, todos os dados do cliente
                serão perdidos, e essa ação não poderá ser desfeita.
              </p>
            </div>

            <div className="w-full flex items-center justify-center gap-3.5 mt-[34px]">
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
          title="Erro ao excluir cliente!"
          description={errorMessage}
        />
      )}

      {isSuccess && (
        <Toast
          onClose={() => setIsSuccess(false)}
          variant="successSolid"
          title="Cliente excluído com sucesso!"
          description="O cliente foi excluído com sucesso."
        />
      )}
    </>
  )
}

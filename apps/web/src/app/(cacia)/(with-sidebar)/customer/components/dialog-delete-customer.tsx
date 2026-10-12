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
import { Toast } from "@/components/ui/toast"
import { useCustomers } from "@/http/hooks/customer"
import { deleteCustomer } from "@/http/customer/delete-customer"
import { Icon } from "@/components/icone"

export function DialogDeleteCustomer() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [openSuccess, setOpenSuccess] = useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)

  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search") || ""
  const deleteCustomerId = searchParams.get("deleteCustomerId")

  const { mutate } = useCustomers({ page, search: search ?? "" })

  useEffect(() => {
    if (deleteCustomerId) {
      setIsOpen(true)
    }

    if (!deleteCustomerId) {
      setIsOpen(false)
    }
  }, [deleteCustomerId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!deleteCustomerId) return

    try {
      setIsLoading(true)

      const result = await deleteCustomer(deleteCustomerId)

      if (!result.success) {
        setHasError(true)
        setErrorMessage(
          typeof result.error === "string"
            ? result.error
            : "Erro ao excluir cliente"
        )

        return
      }

      mutate()

      setOpenSuccess(true)

      onClose()

      setIsLoading(false)
    } catch (error) {
      setHasError(true)
      setErrorMessage("Erro inesperado ao excluir cliente")
      console.error("Erro inesperado:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const onClose = () => {
    const params = new URLSearchParams(searchParams)
    params.delete("deleteCustomerId")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="px-[30px]">
        <DialogHeader>
          <DialogTitle className="sr-only">
            Deseja mesmo excluir o cliente?
          </DialogTitle>
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
              Deseja mesmo excluir o cliente?
            </h4>

            <p className="text-center text-[14.5px] leading-[1.5] text-tinta-2">
              Caso prossiga com esta solicitação, todos os dados do cliente
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
              disabled={isLoading}
              type="submit"
              isLoading={isLoading}
              variant="danger"
            >
              Excluir mesmo assim
            </Button>
          </div>
        </form>
      </DialogContent>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao excluir cliente!"
          description={errorMessage}
        />
      )}

      {openSuccess && (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="successSolid"
          title="Cliente excluído com sucesso!"
          description="O cliente foi excluído com sucesso."
        />
      )}
    </Dialog>
  )
}

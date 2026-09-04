import { Button } from "@/components/ui/custom-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Toast } from "@/components/ui/toast"
import { useService, useServiceById } from "@/http/hooks/service"
import { deleteService } from "@/http/service/delete-service"
import { Icon } from "@iconify/react/dist/iconify.js"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function DialogDeleteService() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [openSuccess, setOpenSuccess] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)

  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("page") || ""

  const deleteServiceId = searchParams.get("deleteServiceId")

  const { mutate } = useService(page, search)

  const { service } = useServiceById(deleteServiceId ?? "")

  useEffect(() => {
    if (deleteServiceId) {
      setIsOpen(true)
    }

    if (!deleteServiceId) {
      setIsOpen(false)
    }
  }, [deleteServiceId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!deleteServiceId) return

    try {
      setIsLoading(true)

      const result = await deleteService(deleteServiceId)

      if (!result.success) {
        setHasError(true)
        setErrorMessage(JSON.stringify(result.error.message))

        return
      }

      mutate()

      setOpenSuccess(true)

      setIsLoading(false)

      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const onClose = () => {
    const params = new URLSearchParams(searchParams)

    params.delete("deleteServiceId")

    router.push(`${pathname}?${params.toString()}`)
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
              Deseja mesmo excluir a dúvida “{service?.title}”?
            </h4>

            <p className="text-[18px] leading-[24px] text-[#4D5D63] text-center">
              Caso prossiga com esta solicitação, todos os dados da dúvida serão
              perdidos, e essa ação não poderá ser desfeita.
            </p>
          </div>

          <div className="w-full flex items-center justify-center gap-3.5 mt-[34px]">
            <Button variant="outline" onClick={onClose}>
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
          title={errorMessage}
          description={errorMessage}
        />
      )}

      {openSuccess && (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="successSolid"
          title="Serviço excluído com sucesso!"
          description="O serviço foi excluído com sucesso."
        />
      )}
    </Dialog>
  )
}

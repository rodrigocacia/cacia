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
import { useQuestion, useQuestionById } from "@/http/hooks/question"
import { deleteQuestion } from "@/http/question/delete-question"
import { Trash2 } from "lucide-react"
import { mensagemDeErro } from "@/utils/error-handlers"

export function DialogDeleteQuestion() {
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
  const deleteQuestionId = searchParams.get("deleteQuestionId")

  const { mutate } = useQuestion(page, search)

  const { question } = useQuestionById(deleteQuestionId ?? "")

  useEffect(() => {
    if (deleteQuestionId) {
      setIsOpen(true)
    }

    if (!deleteQuestionId) {
      setIsOpen(false)
    }
  }, [deleteQuestionId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!question?._id) return

    try {
      setIsLoading(true)

      const result = await deleteQuestion(question?._id)

      if (!result.success) {
        setHasError(true)
        setErrorMessage(mensagemDeErro(result.error))

        return
      }

      mutate()

      setOpenSuccess(true)

      onClose()

      setIsLoading(false)
    } catch (error) {
      console.error(error)
    }
  }

  const onClose = () => {
    const params = new URLSearchParams(searchParams)
    params.delete("deleteQuestionId")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Excluir dúvida</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex w-full flex-col">
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FBEDEA] text-[#A23B2A]">
            <Trash2 size={18} strokeWidth={1.7} aria-hidden />
          </span>

          <div className="mt-4 flex flex-col gap-2">
            <h4 className="font-display text-[26px] leading-[1.15] text-tinta">
              Deseja mesmo excluir a dúvida “{question?.title}”?
            </h4>

            <p className="text-[14px] leading-relaxed text-tinta-2">
              Caso prossiga com esta solicitação, todos os dados da dúvida serão
              perdidos, e essa ação não poderá ser desfeita.
            </p>
          </div>

          <div className="-mx-6 mt-6 flex items-center justify-end gap-2.5 border-t border-filete px-6 pt-4 max-sm:flex-col-reverse max-sm:items-stretch">
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
          title={errorMessage}
          description={errorMessage}
        />
      )}

      {openSuccess && (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="successSolid"
          title="Dúvida excluída com sucesso!"
          description="A dúvida foi excluída com sucesso."
        />
      )}
    </Dialog>
  )
}

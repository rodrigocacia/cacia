"use client"

import { useState } from "react"

import { useParams, useRouter } from "next/navigation"

import { Trash2 } from "lucide-react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { deleteCalendar } from "@/http/calendar/delete-calendar"

import { Button } from "@/components/ui/custom-button"
import { useCalendar } from "@/http/hooks/calendar"

interface DialogDeleteCalendarProps {
  name?: string
}

export function DialogDeleteCalendar({ name }: DialogDeleteCalendarProps) {
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const { id } = useParams()

  const { mutate: mutateCalendar } = useCalendar({ page: 1 })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!id) return

    try {
      setIsLoading(true)

      const result = await deleteCalendar(id as string)

      if (!result.success) {
        return
      }

      setIsLoading(false)

      mutateCalendar()

      router.push("/setting/agenda")
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="danger"
          className="h-9 rounded-[9px] px-3.5 text-[13.5px]"
          iconLeft={<Trash2 size={15} strokeWidth={1.7} />}
        >
          Excluir agenda
        </Button>
      </DialogTrigger>

      <DialogContent className="px-[30px]">
        <DialogHeader>
          <DialogTitle className="text-left text-[17px] font-semibold text-tinta">
            Excluir a agenda &quot;{name}&quot;?
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
          <p className="text-[14px] leading-relaxed text-tinta-2">
            Caso prossiga com esta solicitação, todos os dados da agenda serão
            perdidos, incluindo todos os seus eventos, e essa ação não poderá
            ser desfeita.
          </p>

          <div className="flex w-full items-center justify-end gap-2 max-md:flex-col-reverse max-md:items-stretch">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>

            <Button
              disabled={isLoading}
              isLoading={isLoading}
              variant="danger"
              type="submit"
            >
              Excluir mesmo assim
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

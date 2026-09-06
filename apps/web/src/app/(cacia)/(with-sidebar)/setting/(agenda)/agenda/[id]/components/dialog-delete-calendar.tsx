"use client"

import { useState } from "react"

import { useParams, useRouter } from "next/navigation"

import { FaTrash } from "react-icons/fa"
import { Icon } from "@/components/icone"

import {
  Dialog,
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
          className="cursor-pointer"
          variant="danger"
          iconLeft={<FaTrash size={16} className="text-[#DC2626]" />}
        >
          Excluir Agenda
        </Button>
      </DialogTrigger>

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
              Deseja mesmo excluir a agenda &quot;{name}&quot;?
            </h4>

            <p className="text-[18px] leading-[24px] text-[#4D5D63] text-center">
              Caso prossiga com esta solicitação, todos os dados da agenda serão
              perdidos,incluindo todos os seus eventos, e essa ação não poderá
              ser desfeita.
            </p>
          </div>

          <div className="w-full flex items-center justify-center gap-3.5 mt-[34px]">
            <Button variant="outline" type="button">
              Cancelar
            </Button>

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

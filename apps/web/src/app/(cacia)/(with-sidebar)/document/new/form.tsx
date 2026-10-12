/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"

import { Check, Plus } from "lucide-react"

import { Button, Button as CustomButton } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { DialogTitle } from "@radix-ui/react-dialog"
import { createFolder } from "@/http/folder/create-folder"
import { useState } from "react"
import { Toast } from "@/components/ui/toast"
import { mensagemDeErro } from "@/utils/error-handlers"
import {
  CabecalhoDoFormulario,
  RodapeDoFormulario,
} from "@/components/drawer-or-sheet/partes"

const createFolderFormSchema = z.object({
  title: z.string().min(2, { message: "Insira um nome válido" }),
})

export type CreateFolderFormData = z.infer<typeof createFolderFormSchema>

interface FormComponentProps {
  setOpen(value: boolean): void
  handleOpenSuccess(): void
}

function FormComponent({ setOpen, handleOpenSuccess }: FormComponentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo")
  const [erro, setErro] = useState<string | null>(null)

  const {
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateFolderFormData>({
    resolver: zodResolver(createFolderFormSchema),
  })

  const onSubmit: SubmitHandler<CreateFolderFormData> = async (data) => {
    try {
      const { title } = data

      const resultado = await createFolder({ title })

      if (!resultado.success) {
        setErro(mensagemDeErro(resultado.error))
        return
      }

      setOpen(false)

      handleOpenSuccess()
    } catch (err: any) {
      if (err.message === "Customer with this email already exists") {
        const message = await err.response.json()

        if (message === "Customer with this email already exists") {
          setError("title", {
            type: "manual",
            message: "Já existe uma pasta com este nome.",
          })
        }

        return
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex h-screen w-full flex-col gap-7 overflow-y-auto pb-6 max-md:h-[85vh]"
    >
      {erro && (
        <Toast
          onClose={() => setErro(null)}
          variant="error"
          title="Não foi possível criar a pasta"
          description={erro}
        />
      )}

      <CabecalhoDoFormulario
        rotulo="Documentos"
        titulo="Nova pasta"
        descricao="Dê um nome à pasta. Depois é só adicionar os documentos dentro dela."
      />

      <div className="flex flex-col gap-5">
        <Input
          {...register("title")}
          label="Nome"
          iconName="edit"
          placeholder="Insira o nome da pasta..."
          error={errors?.title}
        />
      </div>

      <RodapeDoFormulario>
        <CustomButton
          type="button"
          className="cursor-pointer"
          variant="outline"
          onClick={() => {
            if (returnTo) {
              router.push(decodeURIComponent(returnTo))
            } else {
              setOpen(false)
            }
          }}
        >
          Cancelar
        </CustomButton>

        <CustomButton
          type="submit"
          className="cursor-pointer px-6"
          variant="primary"
          isLoading={isSubmitting}
          iconLeft={<Check size={16} />}
        >
          Criar pasta
        </CustomButton>
      </RodapeDoFormulario>
    </form>
  )
}

export function Form() {
  const [openSheet, setOpenSheet] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openSuccess, setOpenSuccess] = useState(false)

  const handleOpenSuccess = () => {
    setOpenSuccess(true)
  }

  return (
    <div>
      <div className="h-full max-md:hidden">
        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
          <SheetTrigger asChild>
            <Button
              className="h-10! cursor-pointer px-4 text-[13.5px]"
              iconLeft={<Plus size={16} strokeWidth={2} />}
            >
              Nova pasta
            </Button>
          </SheetTrigger>

          <SheetContent className="min-w-[640px] px-8">
            <SheetTitle className="sr-only">Nova pasta</SheetTitle>

            <FormComponent
              setOpen={setOpenSheet}
              handleOpenSuccess={handleOpenSuccess}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="md:hidden">
        <Drawer
          open={openDrawer}
          onOpenChange={(value) => setOpenDrawer(value)}
        >
          <DrawerTrigger
            aria-label="Nova pasta"
            className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-acao text-white shadow-[0_10px_24px_rgba(21,19,17,0.22)] transition-colors hover:bg-acao-escura md:hidden"
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
          </DrawerTrigger>

          <DrawerContent className="h-full px-4">
            <DialogTitle className="sr-only">Nova pasta</DialogTitle>

            <FormComponent
              setOpen={setOpenDrawer}
              handleOpenSuccess={handleOpenSuccess}
            />
          </DrawerContent>
        </Drawer>
      </div>

      {openSuccess && (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="successSolid"
          title="Pasta adicionada!"
          description="A nova pasta foi adicionada com sucesso."
        />
      )}
    </div>
  )
}

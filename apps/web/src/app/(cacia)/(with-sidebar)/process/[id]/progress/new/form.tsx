"use client"

import {
  Controller,
  SubmitHandler,
  //  SubmitHandler,
  useForm,
} from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Icon } from "@/components/icone"

import { Button, Button as CustomButton } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { CustomTextarea } from "@/components/ui/custom-textarea"

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { DialogTitle } from "@radix-ui/react-dialog"
import { AiOutlinePlus } from "react-icons/ai"
import { Toast } from "@/components/ui/toast"
import { createProgress } from "@/http/progress/create-progress"
import { useParams } from "next/navigation"
import { CustomDateSelect } from "@/components/ui/custom-data-select"
import { useState } from "react"
import { mensagemDeErro } from "@/utils/error-handlers"

export const areasDeAtuacao = [
  { value: "tecnologia", label: "Tecnologia" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "financas", label: "Finanças" },
  { value: "marketing", label: "Marketing" },
  { value: "design", label: "Design" },
  { value: "juridico", label: "Jurídico" },
  { value: "rh", label: "Recursos Humanos" },
]

const createProgressFormSchema = z.object({
  title: z.string().min(9, { message: "Insira um titulo válido" }),
  description: z.string().min(3, { message: "Insira uma descrição válida" }),
  release_at: z.string().min(3, { message: "Insira uma data válida" }),
})

export type CreateProgressFormData = z.infer<typeof createProgressFormSchema>

interface FormComponentProps {
  setOpen(value: boolean): void
  handleOpenSuccess(): void
}

function FormComponent({ setOpen, handleOpenSuccess }: FormComponentProps) {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const params = useParams()

  const process_id = params?.id as string

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProgressFormData>({
    resolver: zodResolver(createProgressFormSchema),
  })

  const onSubmit: SubmitHandler<CreateProgressFormData> = async (data) => {
    try {
      const { title, description, release_at } = data

      const credentials = {
        process_id,
        title,
        description,
        release_at,
      }

      const result = await createProgress(credentials)

      if (!result.success) {
        setHasError(true)
        setErrorMessage(mensagemDeErro(result.error))

        return
      }

      setOpen(false)

      handleOpenSuccess()
    } catch {}
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="px-4 pb-6 w-full h-screen overflow-y-scroll"
    >
      <div className="mt-10 flex flex-col gap-3">
        <div className="flex gap-2">
          <Icon
            icon="mdi:add-circle-outline"
            className="text-[#BBE2E7] w-[30px] h-[30px]"
          />

          <h3 className="text-xl text-[#1B1916] font-bold">
            Novo andamento do processo
          </h3>
        </div>

        <p className="text-base text-[#A39C93]">
          Preencha os campos abaixo para adicionar uma nova nota ao andamento do
          processo
        </p>
      </div>

      <div className="flex flex-col gap-5 mt-10">
        <Input {...register("title")} label="Título" error={errors?.title} />

        <Controller
          name="release_at"
          control={control}
          render={({ field }) => (
            <CustomDateSelect
              label="Data"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <CustomTextarea
              {...field}
              label="Descrição"
              value={field.value}
              placeholder="Insira uma breve descrição sobre o andamento do processo..."
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />

        <div className="flex items-center justify-between">
          <CustomButton
            type="button"
            className="w-[251px] cursor-pointer"
            variant="outline"
          >
            Cancelar
          </CustomButton>

          <CustomButton
            type="submit"
            className="px-10 cursor-pointer"
            variant="primary"
          >
            Salvar processo
          </CustomButton>
        </div>
      </div>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao cadastrar o progresso!"
          description={errorMessage}
        />
      )}
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
              className="cursor-pointer"
              iconLeft={<AiOutlinePlus size={20} />}
            >
              Adicionar andamento
            </Button>
          </SheetTrigger>

          <SheetContent className="min-w-[707px] rounded-tl-[24px] rounded-bl-[24px]">
            <SheetTitle className="sr-only">Adicionar andamento</SheetTitle>

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
          <DrawerTrigger className="md:hidden fixed w-[56px] h-[56px] bottom-6 right-6 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg text-xl">
            +
          </DrawerTrigger>

          <DrawerContent className="h-full">
            <DialogTitle className="sr-only">Adicionar andamento</DialogTitle>

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
          title="Andamento cadastrado!"
          description="O novo andamento foi cadastrado com sucesso."
        />
      )}
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useRef, useState } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Icon } from "@/components/icone"
import { AiOutlinePlus } from "react-icons/ai"

import {
  CreateQuestionFormData,
  createQuestionFormSchema,
} from "@/schemas/question"

import { DialogTitle } from "@radix-ui/react-dialog"

import { Button, Button as CustomButton } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { Toast } from "@/components/ui/toast"

import { Drawer, DrawerContent } from "@/components/ui/drawer"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { updateQuestion } from "@/http/question/update-question"
import { createQuestion } from "@/http/question/create-question"
import { useQuestion, useQuestionById } from "@/http/hooks/question"
import { useIsMobile } from "@/hooks/use-mobile"
import { mensagemDeErro } from "@/utils/error-handlers"

interface FormComponentProps {
  setOpen(value: boolean): void
  handleOpenSuccess(): void
}

function FormComponent({ setOpen, handleOpenSuccess }: FormComponentProps) {
  const searchParams = useSearchParams()

  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search") || ""
  const editId = searchParams.get("editId")

  const router = useRouter()
  const pathname = usePathname()

  const { mutate } = useQuestion(page, search)

  const { question } = useQuestionById(editId ?? "")

  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateQuestionFormData>({
    resolver: zodResolver(createQuestionFormSchema),
  })

  useEffect(() => {
    if (question) {
      reset({
        title: question?.title,
        description: question?.description,
      })
    }
  }, [question, reset])

  const onSubmit: SubmitHandler<CreateQuestionFormData> = async (data) => {
    try {
      const { title, description } = data

      const credentials = {
        title,
        description,
      }

      if (question) {
        const result = await updateQuestion({
          question_id: question._id,
          title,
          description,
        })

        if (!result.success) {
          setHasError(true)
          setErrorMessage(mensagemDeErro(result.error))

          return
        }

        mutate()

        setOpen(false)

        handleOpenSuccess()

        const params = new URLSearchParams(searchParams.toString())
        params.delete("editId")
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      } else {
        const result = await createQuestion(credentials)

        if (!result.success) {
          setHasError(true)
          setErrorMessage(mensagemDeErro(result.error))

          return
        }

        mutate()

        setOpen(false)

        handleOpenSuccess()
      }
    } catch (err: any) {
      if (err.message === "Question with this title already exists") {
        const message = await err.response.json()

        if (message === "Process with this number already exists") {
          setError("title", {
            type: "manual",
            message: "Já existe uma dúvida com este nome.",
          })
        }

        return
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="px-2 md:px-4 pb-6 w-full h-screen overflow-y-scroll"
    >
      <div className="mt-10 flex flex-col gap-3">
        <div className="flex gap-2">
          <Icon
            icon="mdi:add-circle-outline"
            className="text-[#BBE2E7] w-[30px] h-[30px]"
          />

          <h3 className="text-xl text-[#1B1916] font-bold">
            {/* Pelo `editId`, e não pela dúvida carregada: enquanto ela chega,
                o título dizia "Nova" numa edição. */}
            {editId ? "Editar dúvida" : "Nova dúvida"}
          </h3>
        </div>

        <p className="text-base text-[#A39C93]">
          {editId
            ? "Edite os campos para atualizar a dúvida"
            : "Cadastre a pergunta e a resposta."}
        </p>
      </div>

      <div className="flex flex-col justify-between mt-10">
        <div className="flex flex-col gap-5">
          <Input
            {...register("title")}
            iconName="edit"
            label="Pergunta"
            placeholder="Pergunta"
            error={errors?.title}
          />

          <Controller
            name="description"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <CustomTextarea
                {...field}
                label="Resposta"
                placeholder="Resposta"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-4 max-md:flex-col">
          <CustomButton
            type="button"
            onClick={() => setOpen(false)}
            className="w-full md:w-[251px] cursor-pointer"
            variant="outline"
          >
            Cancelar
          </CustomButton>

          <CustomButton
            type="submit"
            className="w-full md:w-auto px-10 cursor-pointer"
            variant="primary"
            isLoading={isSubmitting}
          >
            {editId ? "Editar dúvida" : "Salvar dúvida"}
          </CustomButton>
        </div>
      </div>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title={errorMessage}
          description={
            question
              ? "A dúvida não foi atualizada com sucesso."
              : "A dúvida não foi cadastrada com sucesso."
          }
        />
      )}
    </form>
  )
}

// O botão do cabeçalho abre o painel (desktop) ou a gaveta (celular); o
// antigo botão flutuante "+" duplicava essa entrada e saiu.
export function Form() {
  const [openSheet, setOpenSheet] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openSuccess, setOpenSuccess] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const editId = searchParams.get("editId")

  const editProcessedRef = useRef(false)

  const isMobile = useIsMobile()

  useEffect(() => {
    if (editId) {
      if (isMobile) {
        setOpenDrawer(true)
      } else {
        setOpenSheet(true)
      }
    }

    if (!editId) {
      if (isMobile) {
        setOpenDrawer(false)
      } else {
        setOpenSheet(false)
      }
    }
  }, [editId, isMobile])

  const handleOpenSuccess = () => {
    setOpenSuccess(true)
  }

  const handleChangeSheet = (value: boolean) => {
    if (!value && editId) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("editId")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })

      editProcessedRef.current = false

      return
    }

    if (value && isMobile) {
      return
    }

    setOpenSheet(value)
  }

  const handleChangeDrawer = (value: boolean) => {
    if (!value && editId) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("editId")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })

      editProcessedRef.current = false
    }

    if (value && !isMobile) {
      return
    }

    setOpenDrawer(value)
  }

  const handleNewProcessClick = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("editId")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })

    editProcessedRef.current = false

    if (isMobile) {
      setOpenSheet(false)
      setOpenDrawer(true)
    } else {
      setOpenDrawer(false)
      setOpenSheet(true)
    }
  }

  return (
    <div>
      <div className="h-full">
        <Sheet open={openSheet} onOpenChange={handleChangeSheet}>
          <Button
            className="w-full md:w-auto"
            iconLeft={<AiOutlinePlus size={20} />}
            onClick={handleNewProcessClick}
          >
            Nova dúvida
          </Button>

          <SheetContent className="w-full md:min-w-[707px] rounded-tl-[24px] rounded-bl-[24px] max-w-full">
            <SheetTitle className="sr-only">
              {editId ? "Editar dúvida" : "Nova dúvida"}
            </SheetTitle>

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
          onOpenChange={handleChangeDrawer}
          preventScrollRestoration
          repositionInputs={false}
        >
          <DrawerContent className="h-[90vh] max-h-screen">
            <DialogTitle className="sr-only">
              {editId ? "Editar dúvida" : "Nova dúvida"}
            </DialogTitle>

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
          title={editId ? "Dúvida atualizada!" : "Dúvida cadastrada!"}
          description={
            editId
              ? "A dúvida foi atualizada com sucesso."
              : "A nova dúvida foi cadastrada com sucesso."
          }
        />
      )}
    </div>
  )
}

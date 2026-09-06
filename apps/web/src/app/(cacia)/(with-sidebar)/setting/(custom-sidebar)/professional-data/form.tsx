"use client"

import { useState } from "react"

import { Icon } from "@/components/icone"

import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/custom-input"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { Button } from "@/components/ui/custom-button"
import { useOfficeById } from "@/http/hooks/office"
import { Spinner } from "@/components/ui/sppiner"

import { updateOffice } from "@/http/office/udpate-office"
import { Toast } from "@/components/ui/toast"
import { Check } from "lucide-react"
import { formatDocument } from "@/utils/formatters"

const updateOfficeFormSchema = z.object({
  name: z.string().min(6, { message: "Insira um nome válido" }),
  document: z.string().optional(),
  oab_number: z.string().optional(),
  legal_name: z.string().min(6, { message: "Insira uma razão social válida" }),
  trade_name: z.string().min(6, { message: "Insira um nome fantasia válido" }),
  description: z.string().min(6, { message: "Insira uma descrição válida" }),
})

export type UpdateOfficeFormData = z.infer<typeof updateOfficeFormSchema>

export function Form() {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [success, setSuccess] = useState(false)

  const { office, isLoading, mutate } = useOfficeById()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateOfficeFormData>({
    defaultValues: {
      name: office?.name,
      document: office?.document ? formatDocument(office.document) : "",
      oab_number: office?.oab_number,
      legal_name: office?.legal_name,
      trade_name: office?.trade_name,
      description: office?.description,
    },
    resolver: zodResolver(updateOfficeFormSchema),
  })

  const onSubmit: SubmitHandler<UpdateOfficeFormData> = async (data) => {
    try {
      const { name, trade_name, description } = data

      const result = await updateOffice({
        name,
        trade_name,
        description,
      })

      if (!result.success) {
        setHasError(true)
        setErrorMessage(JSON.stringify(result.error.message))
        return
      }

      mutate()

      setSuccess(true)
    } catch {}
  }

  if (isLoading) return <Spinner />

  return (
    <div className="h-full p-8 max-md:p-0 pb-6 md:rounded-2xl md:shadow-sm md:pb-0">
      <div className="flex items-center gap-3 max-md:mt-4">
        <Icon icon="mdi:work-outline" className="w-8 h-8 text-[#BDBDBD]" />

        <h3 className="text-[20px] text-[#707070] font-bold">
          Dados profissionais
        </h3>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full mt-6 flex flex-col justify-between gap-8 pb-10"
      >
        <div className="w-full flex flex-col gap-4">
          <Input
            disabled
            {...register("document")}
            iconName="contact"
            label="CNPJ"
            aria-label="Nome"
            mask={
              office?.document && office.document.length === 14 ? "cnpj" : "cpf"
            }
            error={errors.document}
          />

          <Input
            {...register("oab_number")}
            label="Número da OAB"
            disabled
            placeholder="Número da OAB..."
            mask="fixed"
            iconName="contact"
            error={errors?.oab_number}
          />

          <div className="w-full flex gap-6 items-center justify-between max-md:flex-col max-md:gap-4">
            <div className="w-full">
              <Input
                {...register("name")}
                iconName="build"
                label="Nome ou nome fantasia"
                aria-label="Nome"
                error={errors?.name}
              />
            </div>

            <div className="w-full">
              <Input
                {...register("trade_name")}
                label="Razão social"
                aria-label="Email"
                error={errors?.trade_name}
              />
            </div>
          </div>

          <Controller
            name="description"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <CustomTextarea
                {...field}
                label="Biografia"
                placeholder="Insira a sua biografia..."
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>

        <div className="w-full flex items-center justify-end max-md:flex-col max-md:gap-4 mt-8 max-md:pb-10">
          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="px-10 cursor-pointer max-md:w-full"
            variant="primary"
            iconLeft={<Check />}
          >
            Salvar
          </Button>
        </div>
      </form>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao atualizar os dados profissionais!"
          description={errorMessage}
        />
      )}

      {success && (
        <Toast
          onClose={() => setSuccess(false)}
          variant="successSolid"
          title="Dados profissionais atualizados com sucesso!"
          description="Os dados profissionais foram atualizados com sucesso!"
        />
      )}
    </div>
  )
}

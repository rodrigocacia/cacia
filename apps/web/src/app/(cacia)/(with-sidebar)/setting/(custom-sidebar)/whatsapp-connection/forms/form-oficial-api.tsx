"use client"

import { useState } from "react"

import { SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/custom-input"
import { Button } from "@/components/ui/custom-button"
import { useOfficeById } from "@/http/hooks/office"
import { Spinner } from "@/components/ui/sppiner"

import { updateOffice } from "@/http/office/udpate-office"
import { Toast } from "@/components/ui/toast"

import { Check } from "lucide-react"
import { Icon } from "@/components/icone"
import { Switch } from "@/components/ui/switch"
import { formatDocument } from "@/utils/formatters"
import { mensagemDeErro } from "@/utils/error-handlers"

const updateOfficeFormSchema = z.object({
  name: z.string().min(6, { message: "Insira um nome válido" }),
  document: z.string().optional(),
  legal_name: z.string().min(6, { message: "Insira uma razão social válida" }),
  trade_name: z.string().min(6, { message: "Insira um nome fantasia válido" }),
  description: z.string().min(6, { message: "Insira uma descrição válida" }),
})

export type UpdateOfficeFormData = z.infer<typeof updateOfficeFormSchema>

export function FormOficialApi() {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [success, setSuccess] = useState(false)

  const { office, isLoading, mutate } = useOfficeById()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateOfficeFormData>({
    defaultValues: {
      name: office?.name,
      document: office?.document ? formatDocument(office.document) : "",
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
        setErrorMessage(mensagemDeErro(result.error))
        return
      }

      mutate()

      setSuccess(true)
    } catch {}
  }

  if (isLoading) return <Spinner />

  return (
    <div className="w-full h-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full mt-6 flex flex-col justify-between gap-8 pb-10"
      >
        <div className="w-full flex flex-col gap-4">
          <Input
            disabled
            {...register("document")}
            iconName="build"
            label="ID da conta do WhatsApp Business"
            aria-label="Nome"
            mask={
              office?.document && office.document.length === 14 ? "cnpj" : "cpf"
            }
            error={errors.document}
          />

          <div className="w-full flex gap-6 items-center justify-between max-md:flex-col max-md:gap-4">
            <div className="w-full">
              <Input
                {...register("name")}
                iconName="build"
                label="ID do número de telefone"
                aria-label="Nome"
                error={errors?.name}
              />
            </div>

            <div className="w-full">
              <Input
                {...register("trade_name")}
                label="Token de acesso"
                iconName="contact"
                aria-label="Email"
                error={errors?.trade_name}
              />
            </div>
          </div>

          <div className="w-full flex justify-between bg-[#ECF7F8] px-3 py-4 rounded-[12px]">
            <div className="flex flex-col gap-2">
              <h4 className="text-base text-[#707070] font-semibold">
                Status da conexão
              </h4>

              <p className="text-sm text-[#707070]">
                Receba alertas de novos agendamentos
              </p>

              <div className="w-fit mt-2 flex items-center gap-1.5 bg-[#EDFDEE] rounded-full px-2.5 py-[7px]">
                <Icon
                  icon="ri:whatsapp-fill"
                  className="text-[#16A31B] w-4 h-4"
                />

                <span className="text-xs text-[#16A31B] font-semibold">
                  WhatsApp habilitado
                </span>
              </div>
            </div>

            <Switch />
          </div>
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

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
import { ChipSituacao } from "./partes-conexao"
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
        className="mt-6 flex w-full flex-col justify-between gap-6"
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

          <div className="mt-2 flex items-center justify-between gap-6 border-t border-filete pt-5">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span
                id="status-conexao-oficial"
                className="text-[14px] font-medium text-tinta"
              >
                Status da conexão
              </span>
              <p className="text-[13px] text-tinta-3">
                Receba alertas de novos agendamentos
              </p>
              <ChipSituacao situacao="conectado">
                WhatsApp habilitado
              </ChipSituacao>
            </div>

            <Switch aria-labelledby="status-conexao-oficial" />
          </div>
        </div>

        <div className="flex w-full items-center justify-end border-t border-filete pt-6 max-md:flex-col max-md:gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="max-md:w-full"
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

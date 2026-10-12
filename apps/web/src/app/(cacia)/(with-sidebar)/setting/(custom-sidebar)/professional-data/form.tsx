"use client"

import { useEffect, useState } from "react"

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
import { mensagemDeErro } from "@/utils/error-handlers"

import { Cartao, RodapeDoCartao } from "../../_ui/cartao"

// Razão social e nome fantasia são opcionais: só existem para CNPJ, e exigi-los
// (a razão social nem tinha campo na tela) impedia qualquer escritório de
// salvar. O mínimo do nome é o mesmo da API.
const updateOfficeFormSchema = z.object({
  name: z
    .string({ required_error: "Insira um nome válido" })
    .trim()
    .min(2, { message: "Insira um nome válido" }),
  document: z.string().optional(),
  oab_number: z.string().optional(),
  legal_name: z.string().optional(),
  trade_name: z.string().optional(),
  description: z.string().optional(),
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateOfficeFormData>({
    resolver: zodResolver(updateOfficeFormSchema),
  })

  // Os valores iniciais vêm quando o escritório chega, e não no primeiro
  // render: nesse momento ele ainda está carregando e o formulário ficava vazio.
  // A API devolve `null` nos campos não preenchidos; input não aceita null.
  useEffect(() => {
    if (!office) return

    reset({
      name: office.name ?? "",
      document: office.document ? formatDocument(office.document) : "",
      oab_number: office.oab_number ?? "",
      legal_name: office.legal_name ?? "",
      trade_name: office.trade_name ?? "",
      description: office.description ?? "",
    })
  }, [office, reset])

  const ehCnpj = (office?.document ?? "").replace(/\D/g, "").length === 14

  const onSubmit: SubmitHandler<UpdateOfficeFormData> = async (data) => {
    try {
      const { name, legal_name, trade_name, description } = data

      const result = await updateOffice({
        name,
        legal_name,
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
    } catch {
      setHasError(true)
      setErrorMessage("Erro inesperado ao salvar os dados profissionais")
    }
  }

  if (isLoading) return <Spinner />

  return (
    <Cartao
      titulo="Dados profissionais"
      descricao="Como o escritório aparece para os clientes e para o assistente."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-7"
      >
        <div className="w-full flex flex-col gap-4">
          <div className="grid w-full gap-4 md:grid-cols-2">
            <Input
              disabled
              {...register("document")}
              iconName="contact"
              label={ehCnpj ? "CNPJ" : "CPF"}
              aria-label={ehCnpj ? "CNPJ" : "CPF"}
              mask={ehCnpj ? "cnpj" : "cpf"}
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
          </div>

          <Input
            {...register("name")}
            iconName="build"
            label="Nome do escritório"
            aria-label="Nome do escritório"
            error={errors?.name}
          />

          {ehCnpj && (
            <div className="grid w-full gap-4 md:grid-cols-2">
              <div className="w-full">
                <Input
                  {...register("legal_name")}
                  label="Razão social"
                  aria-label="Razão social"
                  error={errors?.legal_name}
                />
              </div>

              <div className="w-full">
                <Input
                  {...register("trade_name")}
                  label="Nome fantasia"
                  aria-label="Nome fantasia"
                  error={errors?.trade_name}
                />
              </div>
            </div>
          )}

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

        <RodapeDoCartao>
          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="px-5"
            variant="primary"
            iconLeft={<Check size={16} />}
          >
            Salvar
          </Button>
        </RodapeDoCartao>
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
    </Cartao>
  )
}

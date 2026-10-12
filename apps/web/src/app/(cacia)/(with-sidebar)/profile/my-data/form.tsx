"use client"

import { useState } from "react"

import { Button } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { InputPhone } from "@/components/ui/custom-input-phone"
import { formatDocument } from "@/utils/formatters"
import { updateUser } from "@/http/user/update-user"
import { Toast } from "@/components/ui/toast"
import { useMe } from "@/http/hooks/user"
import { revalidateProfile } from "../actions"
import { mensagemDeErro } from "@/utils/error-handlers"
import { Check } from "lucide-react"

import { Cartao, RodapeDoCartao } from "../../setting/_ui/cartao"

function formatPhoneToE164(phone: string): string {
  if (!phone) return ""
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("55")) {
    return `+${cleaned}`
  }
  return `+55${cleaned}`
}

interface FormProps {
  name: string
  document: string
  phone: string
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  document: z.string().refine(
    (val) => {
      const cleanVal = val.replace(/\D/g, "")
      return cleanVal.length === 11 || cleanVal.length === 14
    },
    { message: "Insira um CPF ou CNPJ válido" }
  ),
  phone: z.string().min(14, { message: "Telefone é obrigatório" }),
})

type FormData = z.infer<typeof formSchema>

export function Form({ name, document, phone }: FormProps) {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const { mutate } = useMe()

  const {
    handleSubmit,
    register,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name,
      document: document ? formatDocument(document) : "",
      phone: formatPhoneToE164(phone),
    },
  })

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const result = await updateUser({
        name: data.name,
        document: data.document,
        phone: data.phone,
      })

      if (!result.success) {
        setHasError(true)
        setErrorMessage(mensagemDeErro(result.error))
        return
      }

      setIsSuccess(true)
      await mutate()
      await revalidateProfile()
    } catch {
      setHasError(true)
      setErrorMessage("Erro interno no servidor")
    }
  }

  return (
    <Cartao
      titulo="Meus dados"
      descricao="Seus dados pessoais, usados no cadastro e nos documentos."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-7"
      >
        <div className="w-full flex flex-col gap-4">
          <Input
            iconName="person"
            label="Nome completo"
            aria-label="Nome"
            autoComplete="name"
            {...register("name")}
            error={errors?.name}
          />

          <div className="grid w-full gap-4 md:grid-cols-2">
            <div className="w-full">
              <Input
                iconName="contact"
                label="CPF / CNPJ"
                mask="cpfCnpj"
                aria-label="Nome"
                {...register("document")}
                error={errors?.document}
              />
            </div>

            <div className="w-full">
              <InputPhone
                control={control}
                name="phone"
                label="Telefone"
                error={errors?.phone}
              />
            </div>
          </div>
        </div>

        <RodapeDoCartao>
          <Button
            type="submit"
            disabled={isSubmitting}
            iconLeft={<Check size={16} />}
            isLoading={isSubmitting}
            className="px-5"
            variant="primary"
          >
            Salvar
          </Button>
        </RodapeDoCartao>
      </form>

      {isSuccess && (
        <Toast
          onClose={() => setIsSuccess(false)}
          variant="successSolid"
          title="Dados atualizados com sucesso!"
          description="Os dados foram atualizados com sucesso!"
        />
      )}

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao atualizar os dados!"
          description={errorMessage}
        />
      )}
    </Cartao>
  )
}

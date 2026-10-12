"use client"

import { ArrowRight } from "lucide-react"

import { Controller, useFormContext } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"

import { Button as CustomButton } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"

import { CustomRadioButton } from "@/components/ui/custom-radio-button"
import { CustomerFormData } from "@/schemas/customer"
import { InputPhone } from "@/components/ui/custom-input-phone"
import { useEffect } from "react"
import { validateCpf } from "@/utils/validate-cpf"
import { RodapeDoFormulario } from "@/components/drawer-or-sheet/partes"

interface PersonalData {
  nextStep(): void
  close(): void
  /** Na edição o documento fica travado: a API não o altera. */
  editando?: boolean
}

export function PersonalData({ nextStep, close, editando }: PersonalData) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo")

  const {
    register,
    watch,
    control,
    setValue,
    getValues,
    setError,
    formState: { errors },
    trigger,
  } = useFormContext<CustomerFormData>()

  const typeDocument = watch("type_document")

  useEffect(() => {
    if (!typeDocument) {
      setValue("type_document", "CPF")
    }
  }, [typeDocument, setValue])

  async function handleNext(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const isValid = await trigger([
      "name",
      "remotejid",
      "type_document",
      "document",
      "legal_name",
      "trade_name",
    ])

    const { document, type_document } = getValues()

    if (type_document === "CPF") {
      const isValidCpf = validateCpf(document)
      if (!isValidCpf) {
        setError("document", {
          type: "manual",
          message: "CPF inválido",
        })

        return
      }
    }

    if (isValid) {
      nextStep()
    }
  }
  return (
    <form
      onSubmit={handleNext}
      className="flex w-full flex-grow flex-col gap-5"
    >
      <div className="flex flex-col gap-5">
        <Input
          {...register("name")}
          label="Nome"
          iconName="person"
          placeholder="Insira o nome do cliente..."
          autoComplete="name"
          error={errors?.name}
        />

        <InputPhone
          control={control}
          name="remotejid"
          label="Telefone (WhatsApp)"
          placeholder="Insira o número de telefone..."
          error={errors?.remotejid}
        />

        <Input
          {...register("email")}
          label="E-mail"
          iconName="mail"
          placeholder="Insira o e-mail do cliente..."
          autoComplete="email"
          error={errors?.email}
        />

        <div>
          <h4 className="mb-[7px] text-[13px] font-medium text-tinta-2">
            Tipo de cadastro
          </h4>

          <div className="flex items-center gap-6">
            <Controller
              name="type_document"
              control={control}
              defaultValue="CPF"
              render={({ field }) => (
                <>
                  <CustomRadioButton
                    {...field}
                    label="Pessoa física (CPF)"
                    value="CPF"
                    checked={field.value === "CPF"}
                    onChange={(e) => field.onChange(e)}
                  />
                  <CustomRadioButton
                    {...field}
                    label="Pessoa jurídica (CNPJ)"
                    value="CNPJ"
                    checked={field.value === "CNPJ"}
                    onChange={(e) => field.onChange(e)}
                  />
                </>
              )}
            />
          </div>
        </div>

        <Input
          {...register("document")}
          label={typeDocument === "CPF" ? "CPF" : "CNPJ"}
          mask={typeDocument === "CPF" ? "cpf" : "cnpj"}
          placeholder={
            typeDocument === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"
          }
          iconName="contact"
          error={errors?.document}
          readOnly={editando}
        />
        {editando && (
          <p className="-mt-3 text-xs text-gray-500">
            O CPF/CNPJ identifica o cliente e não pode ser alterado.
          </p>
        )}

        {typeDocument === "CNPJ" && (
          <Input
            {...register("legal_name")}
            label="Nome ou nome fantasia"
            placeholder="Insira o nome completo ou nome fantasia..."
            iconName="build"
            autoComplete="organization"
            error={errors?.legal_name}
          />
        )}

        {typeDocument === "CNPJ" && (
          <Input
            {...register("trade_name")}
            label="Razão social"
            placeholder="Insira a razão social da em empresa..."
            iconName="build"
            autoComplete="organization"
            error={errors?.trade_name}
          />
        )}
      </div>

      <RodapeDoFormulario>
        <CustomButton
          type="button"
          onClick={() => {
            if (returnTo) {
              router.push(decodeURIComponent(returnTo))
            } else {
              close()
            }
          }}
          className="cursor-pointer"
          variant="outline"
        >
          Cancelar
        </CustomButton>

        <CustomButton
          type="submit"
          className="cursor-pointer px-6"
          variant="primary"
          iconRight={<ArrowRight size={16} />}
        >
          Prosseguir
        </CustomButton>
      </RodapeDoFormulario>
    </form>
  )
}

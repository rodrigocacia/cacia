/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Button } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { useCityByUf } from "@/http/hooks/city"
import { useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { CustomSelect } from "@/components/ui/custom-select"
import { ufs } from "@/constants/ufs"
import { z } from "zod"
import { getCepInformations } from "@/http/get-cep-informations"
import { Toast } from "@/components/ui/toast"
import { AUTOCOMPLETE_VALUES } from "@/constants/autocomplete"
import { updateOffice } from "@/http/office/udpate-office"
import { Check } from "lucide-react"

import { Cartao, RodapeDoCartao } from "../../setting/_ui/cartao"

export const addressFormSchema = z.object({
  street: z.string().min(4, { message: "Insira a Rua" }),
  number: z.string().min(1, { message: "Insira o Número" }),
  cep: z.string().min(6, { message: "Insira o Cep" }),
  neighborhood: z.string().min(4, { message: "Insira o Bairro" }),
  city: z.string().min(6, { message: "Insira a Cidade" }),
  state: z.string().min(1, { message: "Insira o Estado" }),
  complement: z.string().optional(),
})

export type AddressFormData = z.infer<typeof addressFormSchema>

interface FormProps {
  address: {
    cep: string
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    complement: string
  }
}

export function Form({ address }: FormProps) {
  const [stateByUserSelected, setStateByUserSelected] = useState("")
  const [hasError, setHasError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const { data } = useCityByUf(stateByUserSelected)

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    // setError,
    //reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    defaultValues: {
      cep: address?.cep,
      street: address?.street,
      number: address?.number,
      neighborhood: address?.neighborhood,
      city: address?.city,
      state: address?.state,
    },
  })

  const cep = watch("cep") || ""

  useEffect(() => {
    async function fetchAddress(cep: string) {
      try {
        const cleanedCep = cep.replace(/\D/g, "")

        if (cleanedCep.length !== 8) return

        const response = await getCepInformations(cleanedCep)

        if (response.erro) {
          return
        }

        setValue("street", response.logradouro || "")
        setValue("neighborhood", response.bairro || "")
        setValue("city", response.localidade || "", {
          shouldValidate: true,
          shouldDirty: true,
        })
        setValue("state", response.uf || "", {
          shouldValidate: true,
          shouldDirty: true,
        })
        setStateByUserSelected(response.uf)
      } catch (error) {
        console.error("Erro ao buscar o CEP", error)
      }
    }

    if (cep) {
      if (cep.length === 9) {
        fetchAddress(cep)
      }
    }
  }, [cep, setValue])

  const onSubmit: SubmitHandler<AddressFormData> = async (data) => {
    const { cep, number, city, neighborhood, state, street, complement } = data

    try {
      const result = await updateOffice({
        address: [
          {
            street,
            number,
            cep,
            city,
            state,
            neighborhood,
            complement,
          },
        ],
      })

      if (!result.success) {
        setHasError(true)
        setErrorMessage(result.error?.message || "Erro ao atualizar endereço")
        return
      }

      setIsSuccess(true)
      setHasError(false)
      setErrorMessage("")
    } catch {
      setHasError(true)
      setErrorMessage("Erro interno do servidor")
    }
  }

  return (
    <Cartao
      titulo="Endereço do escritório"
      descricao="Onde o escritório atende. Aparece nos documentos e para os clientes."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-7"
      >
        <div className="w-full flex flex-col gap-4">
          <Input
            {...register("cep")}
            label="CEP"
            mask="cep"
            placeholder="Insira o CEP..."
            iconName="place"
            autoComplete={AUTOCOMPLETE_VALUES.POSTAL_CODE}
            error={errors?.cep}
          />

          <Input
            {...register("street")}
            label="Logradouro"
            placeholder="Insira o nome da Rua, Avenida, Travessa..."
            iconName="place"
            autoComplete={AUTOCOMPLETE_VALUES.STREET_ADDRESS}
          />

          <div className="grid md:grid-cols-[4fr_1fr] grid-cols-[3fr_1fr] gap-4">
            <Input
              {...register("neighborhood")}
              label="Bairro"
              placeholder="Insira o nome do bairro..."
              iconName="place"
              autoComplete={AUTOCOMPLETE_VALUES.ADDRESS_LEVEL2}
              error={errors?.neighborhood}
            />

            <Input
              {...register("number")}
              label="Nº"
              placeholder="0"
              autoComplete={AUTOCOMPLETE_VALUES.OFF}
              error={errors?.number}
            />
          </div>

          <Input
            {...register("complement")}
            label="Complemento"
            placeholder="Insira o complemento do endereço..."
            iconName="place"
            error={errors?.complement}
          />

          <Controller
            name="city"
            control={control}
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Cidade"
                options={data?.map((city: any) => ({
                  value: city.nome,
                  label: city.nome,
                }))}
                value={value}
                onChange={(e: any) => {
                  onChange(e.value)
                }}
                iconName="place"
              />
            )}
          />

          <Controller
            name="state"
            control={control}
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Estado"
                options={ufs.map((uf) => ({
                  value: uf.sigla,
                  label: uf.nome,
                }))}
                value={value}
                onChange={(e: any) => {
                  onChange(e)
                  setStateByUserSelected(e)
                }}
                iconName="place"
              />
            )}
          />
        </div>

        <RodapeDoCartao>
          <Button
            type="submit"
            iconLeft={<Check size={16} />}
            disabled={isSubmitting}
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
          title="Endereço atualizado com sucesso!"
          description="O endereço foi atualizado com sucesso!"
        />
      )}

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao cadastrar o cliente!"
          description={errorMessage}
        />
      )}
    </Cartao>
  )
}

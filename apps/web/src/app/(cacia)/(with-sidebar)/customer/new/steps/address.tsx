/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useState } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Check } from "lucide-react"

import { Controller, SubmitHandler, useFormContext } from "react-hook-form"

import { useCityByUf } from "@/http/hooks/city"
import { ufs } from "@/constants/ufs"

import { getCepInformations } from "@/http/get-cep-informations"
import { useCustomers } from "@/http/hooks/customer"

import { Button as CustomButton } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"

import { CustomSelect } from "@/components/ui/custom-select"

import {
  createCustomer,
  CreateCustomerRequest,
} from "@/http/customer/create-customer"
import { CustomerFormData } from "@/schemas/customer"
import { Toast } from "@/components/ui/toast"
import { Customer } from "@/types/customer"
import { updateCustomer } from "@/http/customer/update-customer"
import { useLeads } from "@/http/hooks/lead"
import { getCepsByCity } from "@/http/get-city-cep-informations"

interface AddressProps {
  lastStep(): void
  close(): void
  openSuccess(): void
  customer?: Customer | null
}

export function Address({
  lastStep,
  close,
  openSuccess,
  customer,
}: AddressProps) {
  const [stateByUserSelected, setStateByUserSelected] = useState("")
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const { data } = useCityByUf(stateByUserSelected)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("page") || ""
  const leadId = searchParams.get("leadId") || ""
  const returnTo = searchParams.get("returnTo")

  const { mutate } = useCustomers({ page, search })
  const { mutate: mutateLead } = useLeads(1, "", "")

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useFormContext<CustomerFormData>()

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

  const city = watch("city") || ""
  const state = watch("state") || ""

  const fetchCeps = useCallback(async () => {
    if (city && state && !cep) {
      const ceps = await getCepsByCity(state, city)

      const firstAddress = ceps[0]

      setValue("cep", firstAddress.cep)
    }
  }, [cep, city, setValue, state])

  useEffect(() => {
    fetchCeps()
  }, [city, fetchCeps, state])

  const onSubmit: SubmitHandler<CustomerFormData> = async (data) => {
    const {
      name,
      email,
      document,
      remotejid,
      legal_name,
      trade_name,
      cep,
      number,
      city,
      neighborhood,
      state,
      street,
      complement,
    } = data

    try {
      const addressData =
        cep || street || number || city || neighborhood || state
          ? [
              {
                street: street || "",
                number: number || "",
                cep: cep || "",
                city: city || "",
                state: state || "",
                neighborhood: neighborhood || "",
                complement: complement || "",
              },
            ]
          : []

      const credentials: CreateCustomerRequest = {
        name,
        document,
        email: email || undefined,
        legal_name: legal_name ?? "",
        remotejid,
        trade_name: trade_name ?? "",
        address: addressData.length > 0 ? addressData : undefined,
      }

      if (customer) {
        const result = await updateCustomer({
          ...credentials,
          customer_id: customer._id,
        })

        if (!result.success) {
          setHasError(true)
          setErrorMessage(JSON.stringify(result.error.message))

          if (result.error === "Customer with this email already exists") {
            setError("email", {
              type: "manual",
              message: "Já existe um cliente com este e-mail.",
            })

            lastStep()
          }

          return
        }

        const params = new URLSearchParams(searchParams.toString())

        params.delete("action")
        params.delete("leadId")

        await mutate(undefined, { revalidate: true })
        await mutateLead(undefined, { revalidate: true })

        router.push(`${pathname}?${params.toString()}`)

        openSuccess()

        close()

        reset({})
      } else {
        const result = await createCustomer({
          ...credentials,
          lead_id: leadId,
        })

        if (!result.success) {
          setHasError(true)
          setErrorMessage(JSON.stringify(result.error.message))

          if (result.error === "Customer with this email already exists") {
            setError("email", {
              type: "manual",
              message: "Já existe um cliente com este e-mail.",
            })

            lastStep()
          }

          return
        }

        const params = new URLSearchParams(searchParams.toString())
        params.delete("action")
        params.delete("leadId")

        await mutate(undefined, { revalidate: true })
        await mutateLead(undefined, { revalidate: true })

        openSuccess()
        close()
        reset({})

        setTimeout(() => {
          if (returnTo) {
            const decodedReturnTo = decodeURIComponent(returnTo)
            const url = new URL(decodedReturnTo, window.location.origin)
            url.searchParams.set("selectedCustomerId", result.data?._id || "")
            if (!url.searchParams.has("newProcess")) {
              url.searchParams.set("newProcess", "true")
            }
            router.push(url.pathname + url.search)
          } else {
            router.push(`/customer/${result.data?._id}/personal-information`)
          }
        }, 100)
      }
    } catch (err: any) {
      if (err.message === "Customer with this email already exists") {
        const message = await err.response.json()

        if (message === "Customer with this email already exists") {
          setError("email", {
            type: "manual",
            message: "Já existe um cliente com este e-mail.",
          })

          lastStep()
        }

        return
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-6 w-full h-screen">
      <div className="flex flex-col gap-5 mt-10">
        <div className="flex flex-col gap-5">
          <h3 className="text-xl font-semibold text-[#3D3D3D]">Endereço</h3>
          <Input
            {...register("cep")}
            label="CEP"
            mask="cep"
            placeholder="Insira o CEP"
            iconName="place"
            error={errors?.cep}
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

          <Controller
            name="city"
            control={control}
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Cidade"
                options={
                  data?.map((city: any) => ({
                    value: city.nome,
                    label: city.nome,
                  })) || []
                }
                value={value}
                onChange={(e: any) => {
                  onChange(e)
                }}
                iconName="place"
              />
            )}
          />

          <Input
            {...register("street")}
            label="Logradouro"
            placeholder="Insira o nome do logradouro"
            iconName="place"
          />

          <Input
            {...register("complement")}
            label="Complemento"
            placeholder="Insira o complemento do endereço..."
            iconName="place"
          />

          <div className="grid md:grid-cols-[4fr_1fr] grid-cols-[3fr_1fr] gap-4">
            <Input
              {...register("neighborhood")}
              label="Bairro"
              placeholder="Insira o nome do bairro..."
              iconName="place"
              error={errors?.neighborhood}
            />

            <Input
              {...register("number")}
              label="Nº"
              placeholder="0"
              error={errors?.number}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 mt-4">
          <CustomButton
            type="button"
            onClick={lastStep}
            className="w-[251px] cursor-pointer"
            variant="outline"
          >
            Voltar
          </CustomButton>

          <CustomButton
            type="submit"
            onClick={() => {}}
            className="px-10 cursor-pointer"
            variant="primary"
            iconLeft={<Check />}
            isLoading={isSubmitting}
          >
            {customer ? "Atualizar cliente" : "Salvar cliente"}
          </CustomButton>
        </div>
      </div>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title={
            customer
              ? "Erro ao atualizar o cliente!"
              : "Erro ao cadastrar o cliente!"
          }
          description={errorMessage}
        />
      )}
    </form>
  )
}

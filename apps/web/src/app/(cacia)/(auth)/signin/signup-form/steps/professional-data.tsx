/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"

import { setCookie } from "cookies-next"

import { Controller, SubmitHandler, useFormContext } from "react-hook-form"

import { Check } from "lucide-react"
import { BiLeftArrowAlt } from "react-icons/bi"

import { ufs } from "@/constants/ufs"

import { useCityByUf } from "@/http/hooks/city"
import { getCepInformations } from "@/http/get-cep-informations"

import { SignupFormData } from "@/schemas/signup"

import {
  parseValidationError,
  parseAddressValidationError,
} from "@/utils/error-handlers"

import { Button } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { CustomSelect } from "@/components/ui/custom-select"
import { CustomTextarea } from "@/components/ui/custom-textarea"

import { createUser, CreateUserRequest } from "@/http/user/create-user"
import { Toast } from "@/components/ui/toast"
import { trackCompleteRegistration } from "@/utils/facebook-pixel"

interface ProfessionalDataProps {
  lastStep(): void
  nextStep(): void
}

export function ProfessionalData({ lastStep }: ProfessionalDataProps) {
  const [openSuccess, setOpenSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [stateByUserSelected, setStateByUserSelected] = useState("")

  const { data } = useCityByUf(stateByUserSelected)

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    setError,
    control,
    setFocus,
    formState: { errors, isSubmitting },
  } = useFormContext<SignupFormData>()

  const typeDocumentUser = watch("type_document_user") || ""
  const userPhone = watch("user_phone")
  const userDocument = watch("user_document")
  const cep = watch("cep") || ""

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }, [])

  useEffect(() => {
    if (typeDocumentUser) {
      setValue("type_document", typeDocumentUser)
    }
  }, [typeDocumentUser, setValue])

  useEffect(() => {
    if (userDocument) {
      setValue("document", userDocument)
    }
  }, [userDocument, setValue])

  useEffect(() => {
    if (userPhone) {
      setValue("remotejid", userPhone)
    }
  }, [userPhone, setValue])

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

  const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
    const {
      document,
      oab_number,
      oab_uf,
      user_name,
      user_email,
      user_password,
      user_phone,
      legal_name,
      trade_name,
      remotejid,
      description,
      street,
      cep,
      neighborhood,
      city,
      number,
      state,
      complement,
    } = data

    try {
      const credentials: CreateUserRequest = {
        user_name,
        user_email,
        user_password,
        user_phone,
        description,
        document,
        oab_number,
        oab_uf,
        legal_name: legal_name || "",
        name: legal_name || user_name,
        trade_name: trade_name || "",
        remotejid,
        address: {
          state: state || "",
          city: city || "",
          neighborhood: neighborhood || "",
          street: street || "",
          number: number || "",
          cep: cep || "",
          complement: complement || "",
        },
        plan: "plan_objectid",
      }

      const result = await createUser(credentials)

      if (!result.success) {
        setHasError(true)

        // Usa a função para transformar erros em mensagens user-friendly
        const friendlyErrorMessage = parseValidationError(result.error.message)
        setErrorMessage(friendlyErrorMessage)

        // Tratamento específico para erros conhecidos
        if (
          result.error.message ===
          "Já existe um escritório com este documento e número de OAB"
        ) {
          setError("oab_number", {
            type: "manual",
            message: "Já existe um escritório com este documento e OAB",
          })

          setFocus("oab_number")
        }

        if (result.error.message === "Telefone do escritório já existe") {
          setError("user_phone", {
            type: "manual",
            message: "Telefone do escritório já existe",
          })

          lastStep()

          setTimeout(() => {
            setFocus("user_phone")
          }, 100)
        }

        if (result.error.message === "Já existe uma conta com este e-mail") {
          setError("user_email", {
            type: "manual",
            message: "Já existe um usuário com este e-mail",
          })

          lastStep()

          setTimeout(() => {
            setFocus("user_email")
          }, 100)
        }

        if (Array.isArray(result.error.message)) {
          const addressError = parseAddressValidationError(result.error.message)

          if (addressError) {
            setError(addressError.field as any, {
              type: "manual",
              message: addressError.message,
            })
            setFocus(addressError.field as any)
          }
        }

        return
      }

      // A mesma sessão que o login grava — ver signin/actions.tsx. Sem o
      // token, a pessoa terminaria o cadastro e cairia na tela de login.
      const sessao = { maxAge: 60 * 60 * 23, path: "/" }

      setCookie("token", result.data.token, sessao)
      setCookie("office_id", result.data._id, sessao)
      setCookie("userData", JSON.stringify(result.data.user), sessao)

      trackCompleteRegistration()

      setOpenSuccess(true)
    } catch {}
  }

  function handleSuccessToastClose() {
    setOpenSuccess(false)

    // A etapa de plano leva ao pagamento, que ainda não foi reimplementado —
    // ver docs/ESTADO.md, "Cobrança". Até lá, o cadastro segue direto para a
    // configuração inicial. Navegação completa, e não router.push, para que
    // o servidor já leia os cookies da sessão recém-criada.
    window.location.href = "/onboard"
  }

  return (
    <form
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      className="w-full h-full pb-4"
    >
      <div className="flex flex-col gap-5">
        <h3 className="text-xl font-semibold text-[#3D3D3D]">
          Dados do advogado
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            {...register("oab_number")}
            label="OAB originária"
            placeholder="Digite seu número da OAB"
            iconName="contact"
            mask="fixed"
            error={errors?.oab_number}
          />

          <div className="flex flex-col gap-2">
            <Controller
              name="oab_uf"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  label="Estado da OAB"
                  placeholder="Selecione"
                  options={ufs.map((uf) => ({
                    value: uf.sigla,
                    label: uf.sigla,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  iconName="place"
                />
              )}
            />
            {errors?.oab_uf && (
              <span className="text-red-500 text-sm">
                {errors?.oab_uf?.message}
              </span>
            )}
          </div>
        </div>

        {typeDocumentUser === "CNPJ" && (
          <Input
            {...register("trade_name")}
            label="Nome ou nome fantasia"
            placeholder="Insira o nome completo ou nome fantasia..."
            iconName="build"
            autoComplete="organization"
            error={errors?.trade_name}
          />
        )}

        {typeDocumentUser === "CNPJ" && (
          <Input
            {...register("legal_name")}
            label="Razão social"
            placeholder="Insira a razão social da em empresa..."
            iconName="build"
            autoComplete="organization"
            error={errors?.legal_name}
          />
        )}

        <Controller
          name="description"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <CustomTextarea
              {...field}
              label="Biografia"
              placeholder="Resuma sua experiência profissional"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-5 mt-8">
        <h3 className="text-xl font-semibold text-[#3D3D3D]">
          Endereço do escritório
        </h3>

        <Input
          {...register("cep")}
          label="CEP"
          mask="cep"
          placeholder={
            typeDocumentUser === "CNPJ"
              ? "Insira o CEP da empresa..."
              : "Insira o CEP..."
          }
          iconName="place"
          error={errors?.cep}
        />

        <Input
          {...register("street")}
          label="Logradouro"
          placeholder="Insira o nome da Rua, Avenida, Travessa..."
          iconName="place"
        />

        <div className="grid md:grid-cols-[4fr_1fr] grid-cols-[2fr_1fr] gap-4">
          <Input
            {...register("neighborhood")}
            label="Bairro"
            placeholder={
              typeDocumentUser === "CNPJ"
                ? "Insira o nome do bairro da empresa..."
                : "Insira o nome do bairro..."
            }
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

      <div className="flex items-center justify-between mt-11">
        <Button
          type="button"
          onClick={lastStep}
          className="w-[251px] cursor-pointer"
          variant="outline"
          iconLeft={<BiLeftArrowAlt size={24} />}
        >
          Voltar
        </Button>

        <Button
          type="submit"
          className="w-[251px] cursor-pointer"
          variant="primary"
          isLoading={isSubmitting}
          iconLeft={<Check />}
        >
          Finalizar
        </Button>
      </div>

      {openSuccess && (
        <Toast
          onClose={handleSuccessToastClose}
          variant="success"
          title="Cadastro realizado com sucesso!"
          description="Seu cadastro foi realizado com sucesso!"
        />
      )}

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao completar cadastro!"
          description={errorMessage}
        />
      )}
    </form>
  )
}

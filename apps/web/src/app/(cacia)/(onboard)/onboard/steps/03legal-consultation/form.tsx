"use client"

import { useEffect, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, SubmitHandler, useForm } from "react-hook-form"

import { Icon } from "@/components/icone"

import { Button } from "@/components/ui/custom-button"
import { Spinner } from "@/components/ui/sppiner"
import { Toast } from "@/components/ui/toast"
import { HeaderSteps } from "../components/header-steps"
import { useOnboardingStore } from "@/stores/use-onboard-store"
import { CustomRadioButton } from "@/components/ui/custom-radio-button"
import { Input } from "@/components/ui/custom-input"
import { updateLegalConsultation } from "@/http/legal-consultation/update-legal-consultation"
import { useLegalConsultation } from "@/http/hooks/legal-consultation"
import {
  convertCurrencyToCents,
  formatNumberToCurrency,
} from "@/utils/formatters"
import {
  LegalConsultationFormData,
  legalConsultationFormSchema,
} from "@/schemas/legal-consultation"

export function Form() {
  const { nextStep, prevStep } = useOnboardingStore()

  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [success, setSuccess] = useState(false)

  const { data: legalConsultation, isLoading, mutate } = useLegalConsultation()

  const {
    control,
    register,
    watch,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<LegalConsultationFormData>({
    resolver: zodResolver(legalConsultationFormSchema),
  })

  const is_charged = watch("is_charged")
  const requires_payment_to_schedule = watch("requires_payment_to_schedule")

  useEffect(() => {
    if (legalConsultation) {
      reset({
        is_charged: !!legalConsultation?.data?.is_charged ? "yes" : "no",
        consultation_value: legalConsultation?.data?.consultation_value
          ? formatNumberToCurrency(
              Number(legalConsultation.data?.consultation_value) / 100
            )
          : "",
        requires_payment_to_schedule: !!legalConsultation?.data
          ?.requires_payment_to_schedule
          ? "yes"
          : "no",
        lawyer_pix_key: legalConsultation?.data?.lawyer_pix_key ?? "",
      })
    }
  }, [legalConsultation, reset])

  const onSubmit: SubmitHandler<LegalConsultationFormData> = async (data) => {
    try {
      const {
        is_charged,
        consultation_value,
        requires_payment_to_schedule,
        lawyer_pix_key,
      } = data

      const credentials = {
        is_charged: is_charged === "yes" ? true : false,
        consultation_value: consultation_value
          ? convertCurrencyToCents(consultation_value)
          : 0,
        requires_payment_to_schedule:
          requires_payment_to_schedule === "yes" ? true : false,
        lawyer_pix_key: lawyer_pix_key ?? "",
      }

      const result = await updateLegalConsultation(credentials)

      if (!result.success) {
        setHasError(true)
        setErrorMessage(JSON.stringify(result.error.message))
        return
      }

      mutate()

      setSuccess(true)

      setTimeout(() => {
        nextStep()
      }, 1000)
    } catch {}
  }

  if (isLoading) return <Spinner />

  return (
    <div className="bg-white relative z-10 w-full h-full max-lg:h-fit flex flex-col shadow-md rounded-4xl px-8 pt-[28px] max-lg:pb-4">
      <HeaderSteps />

      <div className="w-full flex flex-col gap-3 max-md:mt-4 mt-10">
        <div className="flex items-center gap-2">
          <Icon icon="octicon:law-16" className="w-8 h-8 text-[#BDBDBD]" />
          <h3 className="text-[20px] text-[#348C98] font-bold">
            Consulta jurídica
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-normal text-[#3D3D3D]">
            Configure seu modelo de atuação para consultas jurídicas.
          </p>
        </div>
      </div>

      <hr className="w-full my-4 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full mt-6 max-md:mt-4 flex flex-col justify-between gap-8"
      >
        <div className="w-full flex flex-col gap-5">
          <div>
            <h4 className="text-base text-[#707070] font-semibold">
              A consulta jurídica é cobrada?
            </h4>

            <div className="flex items-center gap-4 md:gap-10 mt-6 flex-wrap">
              <Controller
                name="is_charged"
                control={control}
                defaultValue="yes"
                render={({ field }) => (
                  <>
                    <CustomRadioButton
                      {...field}
                      label="Sim"
                      value="yes"
                      checked={field.value === "yes"}
                      onChange={(e) => field.onChange(e)}
                    />
                    <CustomRadioButton
                      {...field}
                      label="Não"
                      value="no"
                      checked={field.value === "no"}
                      onChange={(e) => {
                        field.onChange(e)
                        if (e === "no") {
                          setValue("requires_payment_to_schedule", "no")
                        }
                      }}
                    />
                  </>
                )}
              />
            </div>
          </div>

          {is_charged === "yes" && (
            <Input
              {...register("consultation_value")}
              iconName="money"
              mask="price"
              label="Valor"
              placeholder="R$ 0,00"
              error={errors?.consultation_value}
            />
          )}

          {is_charged === "yes" && (
            <div>
              <h4 className="text-base text-[#707070] font-semibold">
                Exigir pagamento para concluir agendamento?
              </h4>

              <div className="flex items-center gap-4 md:gap-10 mt-6 flex-wrap">
                <Controller
                  name="requires_payment_to_schedule"
                  control={control}
                  defaultValue="yes"
                  render={({ field }) => (
                    <>
                      <CustomRadioButton
                        {...field}
                        label="Sim"
                        value="yes"
                        checked={field.value === "yes"}
                        onChange={(e) => field.onChange(e)}
                      />
                      <CustomRadioButton
                        {...field}
                        label="Não"
                        value="no"
                        checked={field.value === "no"}
                        onChange={(e) => field.onChange(e)}
                      />
                    </>
                  )}
                />
              </div>
            </div>
          )}

          {is_charged === "yes" && (
            <div className="w-full flex flex-col gap-1">
              <h3 className="text-base text-[#707070] font-semibold">
                Chave PIX
              </h3>

              <ul className="flex flex-col gap-1 list-none">
                <li className="text-xs text-[#707070] font-medium">
                  - Esta chave será enviada para recebimento do valor da
                  consulta. Após receber o comprovante de pagamento o
                  agendamento será confirmado.
                </li>

                <li className="text-xs text-[#707070] font-medium">
                  - Você receberá uma notificação do agendamento incluindo o
                  comprovante de pagamento enviado pelo lead/cliente.
                </li>
              </ul>
            </div>
          )}

          {is_charged === "yes" && requires_payment_to_schedule === "yes" && (
            <Input
              {...register("lawyer_pix_key")}
              iconName={null}
              label=""
              placeholder="Sua chave PIX aqui"
              error={errors?.lawyer_pix_key}
            />
          )}
        </div>

        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-[251px] max-lg:w-full cursor-pointer"
              onClick={() => prevStep()}
              iconLeft={
                <Icon
                  icon="mdi:arrow-left"
                  className="w-6 h-6 text-[#707070]"
                />
              }
            >
              Voltar
            </Button>
          </div>

          <Button
            type="submit"
            className="w-[251px] max-lg:w-fit cursor-pointer"
            variant="primary"
            isLoading={isSubmitting}
            iconRight={
              !isSubmitting ? (
                <Icon icon="mdi:arrow-right" className="w-6 h-6 text-white" />
              ) : null
            }
          >
            Prosseguir
          </Button>
        </div>
      </form>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao atualizar a consulta jurídica!"
          description={errorMessage}
        />
      )}

      {success && (
        <Toast
          onClose={() => setSuccess(false)}
          variant="successSolid"
          title="Consulta jurídica atualizada com sucesso!"
          description="A consulta jurídica foi atualizada com sucesso!"
        />
      )}
    </div>
  )
}

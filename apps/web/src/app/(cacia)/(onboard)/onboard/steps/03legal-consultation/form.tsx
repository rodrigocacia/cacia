"use client"

import { useEffect, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, SubmitHandler, useForm } from "react-hook-form"

import { Spinner } from "@/components/ui/sppiner"
import { Toast } from "@/components/ui/toast"
import { HeaderSteps } from "../components/header-steps"
import {
  BotaoAvancar,
  BotaoVoltar,
  RodapeDoPasso,
  SecaoDoPasso,
} from "../components/partes"
import { useOnboardingStore } from "@/stores/use-onboard-store"
import { CustomRadioButton } from "@/components/ui/custom-radio-button"
import { Input } from "@/components/ui/custom-input"
import { updateLegalConsultation } from "@/http/legal-consultation/update-legal-consultation"
import { useLegalConsultation } from "@/http/hooks/legal-consultation"
import {
  convertCurrencyToReais,
  formatNumberToCurrency,
} from "@/utils/formatters"
import {
  LegalConsultationFormData,
  legalConsultationFormSchema,
} from "@/schemas/legal-consultation"
import { mensagemDeErro } from "@/utils/error-handlers"

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
              Number(legalConsultation.data?.consultation_value)
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
          ? convertCurrencyToReais(consultation_value)
          : 0,
        requires_payment_to_schedule:
          requires_payment_to_schedule === "yes" ? true : false,
        lawyer_pix_key: lawyer_pix_key ?? "",
      }

      const result = await updateLegalConsultation(credentials)

      if (!result.success) {
        setHasError(true)
        setErrorMessage(mensagemDeErro(result.error))
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
    <div className="flex w-full flex-col">
      <HeaderSteps />

      <SecaoDoPasso
        titulo="Consulta jurídica"
        descricao="Configure seu modelo de atuação para consultas jurídicas."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col">
        <div className="flex w-full flex-col gap-6">
          <div>
            <h4 className="text-[14px] font-semibold text-tinta">
              A consulta jurídica é cobrada?
            </h4>

            <div className="mt-3 flex flex-wrap items-center gap-6">
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
              <h4 className="text-[14px] font-semibold text-tinta">
                Exigir pagamento para concluir agendamento?
              </h4>

              <div className="mt-3 flex flex-wrap items-center gap-6">
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
              <h4 className="text-[14px] font-semibold text-tinta">
                Chave PIX
              </h4>

              <ul className="flex list-disc flex-col gap-1 pl-4 text-[13px] leading-relaxed text-tinta-2 marker:text-tinta-3">
                <li>
                  Esta chave será enviada para recebimento do valor da consulta.
                  Após receber o comprovante de pagamento o agendamento será
                  confirmado.
                </li>

                <li>
                  Você receberá uma notificação do agendamento incluindo o
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

        <RodapeDoPasso>
          <BotaoVoltar onClick={() => prevStep()} />
          <BotaoAvancar isLoading={isSubmitting} />
        </RodapeDoPasso>
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

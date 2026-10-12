"use client"

import { useState } from "react"

import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/custom-button"
import { Spinner } from "@/components/ui/sppiner"
import { Toast } from "@/components/ui/toast"
import { Check } from "lucide-react"
import {
  LegalConsultationFormData,
  legalConsultationFormSchema,
} from "@/schemas/legal-consultation"
import { updateLegalConsultation } from "@/http/legal-consultation/update-legal-consultation"
import { useLegalConsultation } from "@/http/hooks/legal-consultation"
import {
  convertCurrencyToReais,
  formatNumberToCurrency,
} from "@/utils/formatters"
import { Input } from "@/components/ui/custom-input"
import { CustomRadioButton } from "@/components/ui/custom-radio-button"
import { mensagemDeErro } from "@/utils/error-handlers"

import { Cartao, RodapeDoCartao } from "../../_ui/cartao"

export function LegalConsultationDetail() {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [success, setSuccess] = useState(false)

  const { data, isLoading, mutate } = useLegalConsultation()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<LegalConsultationFormData>({
    defaultValues: {
      is_charged: data?.is_charged ? "yes" : "no",
      consultation_value: data?.consultation_value
        ? formatNumberToCurrency(Number(data?.consultation_value))
        : "",
      requires_payment_to_schedule: data?.requires_payment_to_schedule
        ? "yes"
        : "no",
      lawyer_pix_key: data?.lawyer_pix_key ?? "",
    },
    resolver: zodResolver(legalConsultationFormSchema),
  })

  const is_charged = watch("is_charged")
  const requires_payment_to_schedule = watch("requires_payment_to_schedule")

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

      setSuccess(true)

      mutate()
    } catch {}
  }

  if (isLoading) return <Spinner />

  return (
    <Cartao
      titulo="Consulta jurídica"
      descricao="Se a primeira consulta é cobrada e como o assistente pede o pagamento ao agendar."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-7"
      >
        <div className="flex w-full flex-col">
          <fieldset className="flex flex-wrap items-center justify-between gap-4 pb-5">
            <legend className="sr-only">A consulta jurídica é cobrada?</legend>
            <span className="text-[14px] font-medium text-tinta" aria-hidden>
              A consulta jurídica é cobrada?
            </span>

            <div className="flex flex-wrap items-center gap-6">
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
          </fieldset>

          {is_charged === "yes" && (
            <div className="border-t border-filete py-5">
              <Input
                {...register("consultation_value")}
                iconName="money"
                mask="price"
                label="Valor"
                placeholder="R$ 0,00"
                error={errors?.consultation_value}
              />
            </div>
          )}

          {is_charged === "yes" && (
            <fieldset className="flex flex-wrap items-center justify-between gap-4 border-t border-filete py-5">
              <legend className="sr-only">
                Exigir pagamento para concluir agendamento?
              </legend>
              <span className="text-[14px] font-medium text-tinta" aria-hidden>
                Exigir pagamento para concluir agendamento?
              </span>

              <div className="flex flex-wrap items-center gap-6">
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
            </fieldset>
          )}

          {is_charged === "yes" && (
            <div className="flex w-full flex-col gap-3 border-t border-filete pt-5">
              <h3 className="text-[14px] font-medium text-tinta">Chave PIX</h3>

              <ul className="flex list-disc flex-col gap-1 pl-4 text-[13px] text-tinta-2 marker:text-tinta-3">
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

              {requires_payment_to_schedule === "yes" && (
                <Input
                  {...register("lawyer_pix_key")}
                  iconName={null}
                  label=""
                  aria-label="Chave PIX"
                  placeholder="Sua chave PIX aqui"
                  error={errors?.lawyer_pix_key}
                />
              )}
            </div>
          )}
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
          title="Erro ao atualizar a consulta jurídica!"
          description={errorMessage}
        />
      )}

      {success && (
        <Toast
          onClose={() => setSuccess(false)}
          variant="successSolid"
          title="Consulta jurídica atualizada com sucesso!"
          description="As configurações da consulta jurídica foram salvas."
        />
      )}
    </Cartao>
  )
}

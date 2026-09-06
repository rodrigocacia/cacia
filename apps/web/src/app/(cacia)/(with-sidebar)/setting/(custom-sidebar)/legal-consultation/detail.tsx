"use client"

import { useState } from "react"

import { Icon } from "@/components/icone"

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
  convertCurrencyToCents,
  formatNumberToCurrency,
} from "@/utils/formatters"
import { Input } from "@/components/ui/custom-input"
import { CustomRadioButton } from "@/components/ui/custom-radio-button"

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
        ? formatNumberToCurrency(Number(data?.consultation_value) / 100)
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

      setSuccess(true)

      mutate()
    } catch {}
  }

  if (isLoading) return <Spinner />

  return (
    <div className="p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm">
      <div className="w-full flex items-center gap-3 max-md:hidden">
        <Icon icon="octicon:law-16" className="text-[#BDBDBD] w-8 h-8" />

        <h3 className="text-[20px] text-[#707070] font-bold">
          Consulta jurídica
        </h3>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full mt-6 flex flex-col justify-between gap-8"
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

        <div className="w-full flex items-center justify-end max-md:flex-col max-md:gap-4 mt-8 max-md:pb-10 max-md:mt-8">
          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="px-10 cursor-pointer max-md:w-full"
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
          title="Erro ao atualizar o assistente!"
          description={errorMessage}
        />
      )}

      {success && (
        <Toast
          onClose={() => setSuccess(false)}
          variant="successSolid"
          title="Assistente atualizado com sucesso!"
          description="O assistente foi atualizado com sucesso!"
        />
      )}
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"

import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"

import { useOnboardingStore } from "@/stores/use-onboard-store"

import { createCalendar } from "@/http/calendar/create-calendar"
import { useCalendar } from "@/http/hooks/calendar"

import { translateWeekdayToLocale } from "@/utils/day-translation"
import { nomeParaExibir } from "@/utils/formatters"

import { AgendaDetailFormData, schema } from "@/schemas/calendar"

import { TimeInput } from "@/components/ui/custom-timer"
import { Checkbox } from "@/components/ui/checkbox"
import { CustomCheckbox } from "@/components/ui/custom-checkbox"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { CustomSelect } from "@/components/ui/custom-select"
import { Input } from "@/components/ui/custom-input"
import { Toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/sppiner"

import { HeaderSteps } from "../components/header-steps"
import {
  BotaoAvancar,
  BotaoVoltar,
  RodapeDoPasso,
  SecaoDoPasso,
} from "../components/partes"
import { useMe } from "@/http/hooks/user"
import { mensagemDeErro } from "@/utils/error-handlers"

export function Form() {
  const [hasSuccess, setHasSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const { nextStep, prevStep } = useOnboardingStore()

  const { mutate } = useCalendar({ page: 1 })

  const { user } = useMe()

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AgendaDetailFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      user: user?.userId ?? "",
      title: "Agenda geral",
      available_days: [
        {
          day: "MONDAY",
          available: false,
          start_time: "",
          end_time: "",
          online: true,
          in_person: true,
          shift2_available: false,
          shift2_start_time: "",
          shift2_end_time: "",
          shift2_online: false,
          shift2_in_person: false,
        },
        {
          day: "TUESDAY",
          available: false,
          start_time: "",
          end_time: "",
          online: true,
          in_person: true,
          shift2_available: false,
          shift2_start_time: "",
          shift2_end_time: "",
          shift2_online: false,
          shift2_in_person: false,
        },
        {
          day: "WEDNESDAY",
          available: false,
          start_time: "",
          end_time: "",
          online: true,
          in_person: true,
          shift2_available: false,
          shift2_start_time: "",
          shift2_end_time: "",
          shift2_online: false,
          shift2_in_person: false,
        },
        {
          day: "THURSDAY",
          available: false,
          start_time: "",
          end_time: "",
          online: true,
          in_person: true,
          shift2_available: false,
          shift2_start_time: "",
          shift2_end_time: "",
          shift2_online: false,
          shift2_in_person: false,
        },
        {
          day: "FRIDAY",
          available: false,
          start_time: "",
          end_time: "",
          online: true,
          in_person: true,
          shift2_available: false,
          shift2_start_time: "",
          shift2_end_time: "",
          shift2_online: false,
          shift2_in_person: false,
        },
        {
          day: "SATURDAY",
          available: false,
          start_time: "",
          end_time: "",
          online: true,
          in_person: true,
          shift2_available: false,
          shift2_start_time: "",
          shift2_end_time: "",
          shift2_online: false,
          shift2_in_person: false,
        },
        {
          day: "SUNDAY",
          available: false,
          start_time: "",
          end_time: "",
          online: true,
          in_person: true,
          shift2_available: false,
          shift2_start_time: "",
          shift2_end_time: "",
          shift2_online: false,
          shift2_in_person: false,
        },
      ],
    },
  })

  useEffect(() => {
    if (user) {
      setValue("user", user.userId)
    }
  }, [setValue, user])

  const { fields, update } = useFieldArray({
    control,
    name: "available_days",
  })

  if (!user) {
    return <Spinner />
  }

  const onSubmit: SubmitHandler<AgendaDetailFormData> = async (data) => {
    try {
      const { title, general_roles, available_days, user } = data

      const credentials = {
        title,
        general_roles: general_roles || "",
        available_days,
        user,
      }

      const result = await createCalendar(credentials)

      if (!result.success) {
        setHasError(true)
        setErrorMessage(mensagemDeErro(result.error))
        return
      }

      setHasSuccess(true)

      mutate()

      setTimeout(() => {
        nextStep()
      }, 1000)
    } catch {}
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col">
      <HeaderSteps />

      <SecaoDoPasso
        titulo="Nova agenda"
        descricao="Usarei esta agenda para reuniões, prazos e audiências."
      />

      <div className="flex flex-col gap-5">
        <Controller
          name="title"
          control={control}
          render={({ field: { value = "", ...field } }) => (
            <Input
              {...field}
              value={value}
              label="Nome"
              placeholder="Insira o nome da agenda"
              iconName="edit"
              error={errors?.title}
            />
          )}
        />

        <Controller
          name="user"
          control={control}
          render={({ field: { onChange, value } }) => (
            <CustomSelect
              label="Responsável"
              defaultValue={value}
              options={[
                {
                  label: nomeParaExibir(user?.name ?? ""),
                  value: user?.userId ?? "",
                },
              ]}
              value={value}
              onChange={(e: any) => {
                onChange(e)
              }}
              iconName="person"
            />
          )}
        />

        <Controller
          name="general_roles"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <CustomTextarea
              {...field}
              label="Regras gerais da agenda"
              placeholder="Ex.: reagendar até 24h antes."
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
      </div>

      <div className="mt-8">
        <SecaoDoPasso
          titulo="Disponibilidade"
          descricao="Marque os dias em que você atende e os horários de cada turno."
        />
      </div>

      {errors?.available_days &&
        typeof errors.available_days === "object" &&
        "message" in errors.available_days && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400 mt-1">
            {errors.available_days.message as string}
          </p>
        )}

      <div className="flex flex-col rounded-[14px] border border-filete bg-white px-4">
        {fields.map((day, index) => (
          <div
            key={day.day}
            className="flex flex-col gap-2 border-b border-filete py-3.5 last:border-b-0"
          >
            <div className="flex max-[1300px]:flex-col items-center justify-between">
              <div className="w-full flex items-center gap-3">
                <Controller
                  name="available_days"
                  control={control}
                  render={() => (
                    <Checkbox
                      id={`dia-${day.day}`}
                      className="h-5 w-5 rounded-[5px] border border-filete-forte bg-white data-[state=checked]:border-acao data-[state=checked]:bg-acao data-[state=checked]:text-white"
                      checked={day.available}
                      onCheckedChange={() => {
                        const newAvailable = !day.available
                        update(index, {
                          ...day,
                          available: newAvailable,
                          start_time: newAvailable ? "08:00" : "",
                          end_time: newAvailable ? "12:00" : "",
                          shift2_available: newAvailable
                            ? day.shift2_available
                            : false,
                          shift2_start_time: newAvailable
                            ? day.shift2_available
                              ? "14:00"
                              : ""
                            : "",
                          shift2_end_time: newAvailable
                            ? day.shift2_available
                              ? "18:00"
                              : ""
                            : "",
                        })
                      }}
                    />
                  )}
                />

                <label
                  htmlFor={`dia-${day.day}`}
                  className="text-[14px] font-semibold text-tinta"
                >
                  {translateWeekdayToLocale(day.day)}
                </label>
              </div>

              {day.available && (
                <div className="flex max-xl:flex-col gap-2 items-end">
                  <div className="flex flex-col gap-2">
                    <Controller
                      name="available_days"
                      control={control}
                      render={() => (
                        <TimeInput
                          label="Começa"
                          value={day.start_time}
                          onChange={(e) => {
                            update(index, {
                              ...day,
                              start_time: e,
                            })
                          }}
                          className="w-[75px]"
                        />
                      )}
                    />

                    {errors?.available_days?.[index]?.start_time && (
                      <p className="text-xs font-medium text-red-500 dark:text-red-400">
                        {errors?.available_days?.[index]?.start_time?.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Controller
                      name="title"
                      control={control}
                      render={() => (
                        <TimeInput
                          label="Termina"
                          value={day.end_time}
                          onChange={(e) => {
                            update(index, {
                              ...day,
                              end_time: e,
                            })
                          }}
                          className="w-[75px]"
                        />
                      )}
                    />

                    {errors?.available_days?.[index]?.end_time && (
                      <p className="text-xs font-medium text-red-500 dark:text-red-400">
                        {errors?.available_days?.[index]?.end_time?.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 max-md:ml-0 md:ml-4">
                    <label className="text-xs font-medium text-tinta-3">
                      Modalidade
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                      <CustomCheckbox
                        label="Online"
                        checked={day.online || false}
                        onChange={(checked) => {
                          update(index, {
                            ...day,
                            online: checked,
                          })
                        }}
                      />
                      <CustomCheckbox
                        label="Presencial"
                        checked={day.in_person || false}
                        onChange={(checked) => {
                          update(index, {
                            ...day,
                            in_person: checked,
                          })
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {day.available && (
              <div className="flex items-center justify-between pl-8 max-[1300px]:flex-col">
                <div className="w-full flex items-center gap-3">
                  <Checkbox
                    id={`turno2-${day.day}`}
                    className="h-5 w-5 rounded-[5px] border border-filete-forte bg-white data-[state=checked]:border-acao data-[state=checked]:bg-acao data-[state=checked]:text-white"
                    checked={day.shift2_available}
                    onCheckedChange={() => {
                      const newShift2Available = !day.shift2_available
                      update(index, {
                        ...day,
                        shift2_available: newShift2Available,
                        shift2_start_time: newShift2Available ? "14:00" : "",
                        shift2_end_time: newShift2Available ? "18:00" : "",
                        shift2_online: newShift2Available ? true : false,
                        shift2_in_person: newShift2Available ? true : false,
                      })
                    }}
                  />

                  <label
                    htmlFor={`turno2-${day.day}`}
                    className="text-[13.5px] text-tinta-2"
                  >
                    Dois turnos
                  </label>
                </div>

                {day.shift2_available && (
                  <div className="flex max-xl:flex-col gap-2 items-end">
                    <div className="flex flex-col gap-2">
                      <Controller
                        name="available_days"
                        control={control}
                        render={() => (
                          <TimeInput
                            label="Começa"
                            value={day.shift2_start_time}
                            onChange={(e) => {
                              update(index, {
                                ...day,
                                shift2_start_time: e,
                              })
                            }}
                            className="w-[75px]"
                          />
                        )}
                      />

                      {errors?.available_days?.[index]?.shift2_start_time && (
                        <p className="text-xs font-medium text-red-500 dark:text-red-400">
                          {
                            errors?.available_days?.[index]?.shift2_start_time
                              ?.message
                          }
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Controller
                        name="title"
                        control={control}
                        render={() => (
                          <TimeInput
                            label="Termina"
                            value={day.shift2_end_time}
                            onChange={(e) => {
                              update(index, {
                                ...day,
                                shift2_end_time: e,
                              })
                            }}
                            className="w-[75px]"
                          />
                        )}
                      />

                      {errors?.available_days?.[index]?.shift2_end_time && (
                        <p className="text-xs font-medium text-red-500 dark:text-red-400">
                          {
                            errors?.available_days?.[index]?.shift2_end_time
                              ?.message
                          }
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 max-md:ml-0 md:ml-4">
                      <label className="text-xs font-medium text-tinta-3">
                        Modalidade
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                        <CustomCheckbox
                          label="Online"
                          checked={day.shift2_online || false}
                          onChange={(checked) => {
                            update(index, {
                              ...day,
                              shift2_online: checked,
                            })
                          }}
                        />
                        <CustomCheckbox
                          label="Presencial"
                          checked={day.shift2_in_person || false}
                          onChange={(checked) => {
                            update(index, {
                              ...day,
                              shift2_in_person: checked,
                            })
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <RodapeDoPasso>
        <BotaoVoltar onClick={() => prevStep()} />
        <BotaoAvancar isLoading={isSubmitting} />
      </RodapeDoPasso>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao cadastrar agenda"
          description={errorMessage}
        />
      )}

      {hasSuccess && (
        <Toast
          onClose={() => setHasSuccess(false)}
          variant="successSolid"
          title="Agenda cadastrada com sucesso"
          description="A agenda foi cadastrada com sucesso."
        />
      )}
    </form>
  )
}

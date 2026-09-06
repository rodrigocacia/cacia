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
import { formatName } from "@/utils/formatters"

import { AgendaDetailFormData, schema } from "@/schemas/calendar"

import { TimeInput } from "@/components/ui/custom-timer"
import { Checkbox } from "@/components/ui/checkbox"
import { CustomCheckbox } from "@/components/ui/custom-checkbox"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { CustomSelect } from "@/components/ui/custom-select"
import { Input } from "@/components/ui/custom-input"
import { Toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/custom-button"
import { Spinner } from "@/components/ui/sppiner"

import { HeaderSteps } from "../components/header-steps"
import { useMe } from "@/http/hooks/user"
import { Icon } from "@/components/icone"

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
        setErrorMessage(result.error)
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white relative z-10 w-full h-full max-lg:h-fit flex flex-col shadow-md rounded-4xl px-8 pt-[28px] max-lg:pb-4"
    >
      <HeaderSteps />

      <div className="w-full flex flex-col gap-3 max-md:mt-4 mt-10">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:calendar-check" className="text-[#BDBDBD] w-8 h-8" />
          <h3 className="text-[20px] text-[#348C98] font-bold">Nova agenda</h3>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-normal text-[#3D3D3D]">
            Usarei esta agenda para reuniões, prazos e audiências.
          </p>
        </div>
      </div>

      <hr className="w-full my-4 max-md:my-2 h-px border-t-0 bg-gray-200" />

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
                  label: formatName(user?.name ?? ""),
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

      <h3 className="text-[20px] text-[#707070] font-bold mt-8">
        Disponibilidade
      </h3>

      {errors?.available_days &&
        typeof errors.available_days === "object" &&
        "message" in errors.available_days && (
          <p className="text-xs font-medium text-red-500 dark:text-red-400 mt-1">
            {errors.available_days.message as string}
          </p>
        )}

      <hr className="w-full h-px border-t-0 bg-gray-200 mt-3.5" />

      <div className="p-4 bg-[#FCFCFD] flex flex-col gap-4">
        {fields.map((day, index) => (
          <div
            key={day.day}
            className="flex flex-col gap-1 border-b border-[#F5F5F5] pb-3.5"
          >
            <div className="flex max-[1300px]:flex-col items-center justify-between">
              <div className="w-full flex items-center gap-3">
                <Controller
                  name="available_days"
                  control={control}
                  render={() => (
                    <Checkbox
                      id="terms"
                      className="w-6 h-6 
             border border-gray-300 
             data-[state=checked]:bg-[#348C98] 
             data-[state=checked]:text-white 
             data-[state=checked]:border-transparent 
             focus-visible:ring-0 
             focus-visible:ring-offset-0"
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
                  htmlFor="terms"
                  className="text-sm text-[#3D3D3D] font-semibold"
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
                    <label className="text-xs text-[#707070] font-medium">
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
              <div className="pl-14 max-[1300px]:flex-col flex items-center justify-between">
                <div className="w-full flex items-center gap-3">
                  <Checkbox
                    id="terms"
                    className="w-6 h-6 
             border border-gray-300 
             data-[state=checked]:bg-[#348C98] 
             data-[state=checked]:text-white 
             data-[state=checked]:border-transparent 
             focus-visible:ring-0 
             focus-visible:ring-offset-0"
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
                    htmlFor="terms"
                    className="text-sm text-[#3D3D3D] font-semibold"
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
                      <label className="text-xs text-[#707070] font-medium">
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

      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-[251px] max-lg:w-full cursor-pointer"
            onClick={() => prevStep()}
            iconLeft={
              <Icon icon="mdi:arrow-left" className="w-6 h-6 text-[#707070]" />
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

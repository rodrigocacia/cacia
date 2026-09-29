/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"

import { useRouter, useSearchParams } from "next/navigation"

import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { AiOutlinePlus } from "react-icons/ai"
import { Check } from "lucide-react"

import { createCalendar } from "@/http/calendar/create-calendar"

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { DialogTitle } from "@/components/ui/dialog"
import { Toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { CustomSelect } from "@/components/ui/custom-select"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { TimeInput } from "@/components/ui/custom-timer"
import { CustomCheckbox } from "@/components/ui/custom-checkbox"
import { translateWeekdayToLocale } from "@/utils/day-translation"
import { formatName } from "@/utils/formatters"
import { AgendaDetailFormData, schema } from "@/schemas/calendar"
import { useCalendar } from "@/http/hooks/calendar"
import { Me } from "@/types/me"
import { mensagemDeErro } from "@/utils/error-handlers"

interface FormComponentProps {
  setOpen?: (open: boolean) => void
  handleOpenSuccess?: () => void
  user?: Me
}

export function FormComponent({
  setOpen,
  handleOpenSuccess,
  user,
}: FormComponentProps) {
  const [hasSuccess, setHasSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const router = useRouter()

  const searchParams = useSearchParams()

  const { mutate } = useCalendar({ page: 1 })

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AgendaDetailFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      user: user?.userId,
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
          shift2_online: true,
          shift2_in_person: true,
        },
        {
          day: "THURSDAY",
          available: false,
          start_time: "",
          end_time: "",
          online: false,
          in_person: false,
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
          online: false,
          in_person: false,
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
          online: false,
          in_person: false,
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
          online: false,
          in_person: false,
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

      setOpen?.(false)
      handleOpenSuccess?.()
      setHasSuccess(true)

      mutate()

      router.push("/setting/agenda")
    } catch {}
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm"
    >
      <div className="flex flex-col gap-5">
        <Controller
          name="title"
          control={control}
          render={({ field: { value = "", onChange, ...field } }) => (
            <Input
              {...field}
              value={value}
              label="Nome"
              placeholder="Insira o nome da agenda"
              iconName="edit"
              error={errors?.title}
              onChange={(e) => {
                const newValue = e.target.value
                onChange(newValue)

                const params = new URLSearchParams(searchParams.toString())
                params.set("name", newValue)
                router.replace(`?${params.toString()}`, { scroll: false })
              }}
            />
          )}
        />

        {user && (
          <Controller
            name="user"
            control={control}
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Responsável"
                defaultValue={user?.userId}
                options={[
                  {
                    label: formatName(user?.name),
                    value: user?.userId,
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
        )}

        <Controller
          name="general_roles"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <CustomTextarea
              {...field}
              label="Regras gerais da agenda"
              placeholder="Exemplo: Reagendamento em no máximo 24 horas ant..."
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
                      id={`dia-${day.day}`}
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
                          online: newAvailable ? true : false,
                          in_person: newAvailable ? true : false,
                          shift2_start_time:
                            newAvailable && day.shift2_available
                              ? "14:00"
                              : day.shift2_start_time,
                          shift2_end_time:
                            newAvailable && day.shift2_available
                              ? "18:00"
                              : day.shift2_end_time,
                        })
                      }}
                    />
                  )}
                />

                <label
                  htmlFor={`dia-${day.day}`}
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
                    id={`turno2-${day.day}`}
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
                    htmlFor={`turno2-${day.day}`}
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

      <div className="w-full flex items-center justify-end max-md:flex-col max-md:gap-4 mt-8 max-md:pb-10">
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

export function Form() {
  const [openSheet, setOpenSheet] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openSuccess, setOpenSuccess] = useState(false)

  const handleOpenSuccess = () => {
    setOpenSuccess(true)
  }

  return (
    <div>
      <div className="h-full max-md:hidden">
        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
          <SheetTrigger asChild>
            <Button
              className="cursor-pointer min-w-[160px]"
              iconLeft={<AiOutlinePlus size={20} />}
            >
              Novo evento
            </Button>
          </SheetTrigger>

          <SheetContent className="min-w-[707px] rounded-tl-[24px] rounded-bl-[24px] overflow-y-auto">
            <SheetTitle className="sr-only">Novo evento</SheetTitle>

            <FormComponent
              setOpen={setOpenSheet}
              handleOpenSuccess={handleOpenSuccess}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="md:hidden">
        <Drawer
          open={openDrawer}
          onOpenChange={(value) => setOpenDrawer(value)}
        >
          <DrawerTrigger className="md:hidden fixed w-[56px] h-[56px] bottom-6 right-6 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg text-xl">
            +
          </DrawerTrigger>

          <DrawerContent className="h-full overflow-y-auto">
            <DialogTitle className="sr-only">Novo evento</DialogTitle>

            <FormComponent
              setOpen={setOpenDrawer}
              handleOpenSuccess={handleOpenSuccess}
            />
          </DrawerContent>
        </Drawer>
      </div>

      {openSuccess && (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="success"
          title="Processo cadastrado!"
          description="O novo processo foi cadastrado com sucesso."
        />
      )}
    </div>
  )
}

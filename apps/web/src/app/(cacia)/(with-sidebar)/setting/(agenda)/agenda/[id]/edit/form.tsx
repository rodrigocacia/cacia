/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"

import { useParams, useRouter, useSearchParams } from "next/navigation"

import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { AiOutlinePlus } from "react-icons/ai"
import { Check } from "lucide-react"

import { useCalendarById } from "@/http/hooks/calendar"

import { translateWeekdayToLocale } from "@/utils/day-translation"
import { nomeParaExibir } from "@/utils/formatters"
import { AgendaDetailFormData, schema } from "@/schemas/calendar"

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
import { updateCalendar } from "@/http/calendar/update-calendar"
import { Me } from "@/types/me"
import { mensagemDeErro } from "@/utils/error-handlers"

import { Cartao } from "@/app/(cacia)/(with-sidebar)/setting/_ui/cartao"

type DiaDoFormulario = AgendaDetailFormData["available_days"][number]

/**
 * Dia vindo da API no formato do formulário.
 *
 * A API devolve `null` para turno sem horário, e o schema espera texto: o
 * `null` reprovava a validação num campo escondido (turno desligado), sem
 * mensagem nenhuma na tela, e salvar simplesmente não fazia nada. Também
 * descarta `id` e `calendar_id` do dia, que a API recusaria de volta.
 */
function diaParaFormulario(
  dia: Partial<Record<keyof DiaDoFormulario, unknown>>
): DiaDoFormulario {
  const texto = (valor: unknown) => (typeof valor === "string" ? valor : "")

  return {
    day: dia.day as DiaDoFormulario["day"],
    available: Boolean(dia.available),
    start_time: texto(dia.start_time),
    end_time: texto(dia.end_time),
    online: Boolean(dia.online),
    in_person: Boolean(dia.in_person),
    shift2_available: Boolean(dia.shift2_available),
    shift2_start_time: texto(dia.shift2_start_time),
    shift2_end_time: texto(dia.shift2_end_time),
    shift2_online: Boolean(dia.shift2_online),
    shift2_in_person: Boolean(dia.shift2_in_person),
  }
}

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
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [openSuccess, setOpenSuccess] = useState(false)

  const router = useRouter()

  const searchParams = useSearchParams()

  const { id } = useParams()

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AgendaDetailFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      user: user?.userId,
    },
  })

  const { calendar } = useCalendarById(String(id))

  useEffect(() => {
    if (user) {
      setValue("user", user.userId)
    }
  }, [setValue, user])

  const { fields, update } = useFieldArray({
    control,
    name: "available_days",
  })

  useEffect(() => {
    if (calendar) {
      // `user` na resposta é o objeto { id, name }; o formulário guarda o id
      reset({
        title: calendar?.title,
        user: calendar?.user_id ?? user?.userId ?? "",
        general_roles: calendar?.general_roles ?? "",
        available_days: (calendar?.available_days ?? []).map(diaParaFormulario),
      })
    }
  }, [calendar, reset, user?.userId])

  useEffect(() => {
    if (calendar) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("name", calendar.title)
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }, [calendar, router, searchParams])

  const onSubmit: SubmitHandler<AgendaDetailFormData> = async (data) => {
    try {
      const { title, general_roles, available_days } = data

      // O responsável não vai: a API não permite trocá-lo na edição
      const credentials = {
        title,
        general_roles: general_roles || "",
        available_days,
      }

      const result = await updateCalendar({
        calendarId: String(id),
        ...credentials,
      })

      if (!result.success) {
        setHasError(true)
        setErrorMessage(mensagemDeErro(result.error))
        return
      }

      setOpen?.(false)
      setOpenSuccess(true)
      handleOpenSuccess?.()
    } catch {
      setHasError(true)
      setErrorMessage("Erro inesperado ao salvar a agenda")
    }
  }

  // Sem este aviso, um erro de validação num campo fora da vista (ou sem
  // mensagem própria) fazia o "Salvar" parecer não fazer nada.
  const onInvalid = () => {
    setHasError(true)
    setErrorMessage(
      "Confira os campos destacados: há horários ausentes ou fora do formato HH:MM."
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="flex flex-col gap-6"
    >
      <Cartao
        titulo="Dados da agenda"
        descricao="O nome, quem responde por ela e as regras que o assistente segue ao marcar."
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
                      label: nomeParaExibir(user?.name),
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
      </Cartao>

      <Cartao
        titulo="Disponibilidade"
        descricao="Os dias e turnos em que o assistente pode oferecer horários."
        semRecuo
      >
        {errors?.available_days &&
          typeof errors.available_days === "object" &&
          "message" in errors.available_days && (
            <p className="px-7 pt-4 text-xs font-medium text-red-500 max-md:px-5 dark:text-red-400">
              {errors.available_days.message as string}
            </p>
          )}

        <div className="flex flex-col">
          {fields.map((day, index) => (
            <div
              key={day.day}
              className="flex flex-col gap-3 border-t border-[#F1EEE8] px-7 py-4 first:border-t-0 max-md:px-5"
            >
              <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-[150px] items-center gap-3">
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
                            start_time: newAvailable
                              ? day.start_time &&
                                /^([01]\d|2[0-3]):([0-5]\d)$/.test(
                                  day.start_time
                                )
                                ? day.start_time
                                : "08:00"
                              : "",
                            end_time: newAvailable
                              ? day.end_time &&
                                /^([01]\d|2[0-3]):([0-5]\d)$/.test(day.end_time)
                                ? day.end_time
                                : "12:00"
                              : "",
                            online: newAvailable ? true : false,
                            in_person: newAvailable ? true : false,
                            shift2_available: newAvailable
                              ? day.shift2_available
                              : false,
                            shift2_start_time:
                              newAvailable && day.shift2_available
                                ? day.shift2_start_time &&
                                  /^([01]\d|2[0-3]):([0-5]\d)$/.test(
                                    day.shift2_start_time
                                  )
                                  ? day.shift2_start_time
                                  : "14:00"
                                : "",
                            shift2_end_time:
                              newAvailable && day.shift2_available
                                ? day.shift2_end_time &&
                                  /^([01]\d|2[0-3]):([0-5]\d)$/.test(
                                    day.shift2_end_time
                                  )
                                  ? day.shift2_end_time
                                  : "18:00"
                                : "",
                          })
                        }}
                      />
                    )}
                  />

                  <label
                    htmlFor={`dia-${day.day}`}
                    className="cursor-pointer text-[14px] font-medium text-tinta"
                  >
                    {translateWeekdayToLocale(day.day)}
                  </label>
                </div>

                {day.available && (
                  <div className="flex flex-wrap items-end gap-3">
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

                    <div className="flex flex-col gap-2 md:ml-3">
                      <label className="text-xs font-medium text-tinta-2">
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
                <div className="flex min-h-11 flex-wrap items-center justify-between gap-3 pl-8">
                  <div className="flex min-w-[118px] items-center gap-3">
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
                        const newShift2 = !day.shift2_available
                        update(index, {
                          ...day,
                          shift2_available: newShift2,
                          shift2_start_time: newShift2
                            ? day.shift2_start_time &&
                              /^([01]\d|2[0-3]):([0-5]\d)$/.test(
                                day.shift2_start_time
                              )
                              ? day.shift2_start_time
                              : "14:00"
                            : "",
                          shift2_end_time: newShift2
                            ? day.shift2_end_time &&
                              /^([01]\d|2[0-3]):([0-5]\d)$/.test(
                                day.shift2_end_time
                              )
                              ? day.shift2_end_time
                              : "18:00"
                            : "",
                          shift2_online: newShift2 ? true : false,
                          shift2_in_person: newShift2 ? true : false,
                        })
                      }}
                    />

                    <label
                      htmlFor={`turno2-${day.day}`}
                      className="cursor-pointer text-[14px] font-medium text-tinta"
                    >
                      Dois turnos
                    </label>
                  </div>

                  {day.shift2_available && (
                    <div className="flex flex-wrap items-end gap-3">
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

                      <div className="flex flex-col gap-2 md:ml-3">
                        <label className="text-xs font-medium text-tinta-2">
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
      </Cartao>

      <div className="flex items-center justify-end max-md:flex-col max-md:items-stretch">
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
      </div>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao atualizar a agenda!"
          description={errorMessage}
        />
      )}

      {openSuccess && (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="successSolid"
          title="Agenda atualizada!"
          description="A agenda foi atualizada com sucesso."
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
          title="Agenda atualizada!"
          description="A agenda foi atualizada com sucesso."
        />
      )}
    </div>
  )
}

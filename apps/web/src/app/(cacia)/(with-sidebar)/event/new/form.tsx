/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { DialogTitle } from "@radix-ui/react-dialog"

import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Icon } from "@/components/icone"

import { AiOutlinePlus } from "react-icons/ai"

import { Calendar } from "@/types/calendar"
import { Customer } from "@/types/customer"
import { useCalendar } from "@/http/hooks/calendar"
import { formatName } from "@/utils/formatters"

import { createEvent } from "@/http/event/create-event"
import { useProcess } from "@/http/hooks/process"
import { useCustomers } from "@/http/hooks/customer"

import { eventyOptions, statusOptions } from "@/constants/options"

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { Button, Button as CustomButton } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { CustomSelect } from "@/components/ui/custom-select"
import { CustomSelectWithNewAction } from "@/components/ui/custom-select-with-new-action"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { Toast } from "@/components/ui/toast"
import { CustomDateSelect } from "@/components/ui/custom-data-select"
import { TimeInput } from "@/components/ui/custom-timer"
import { NotificationSelector } from "@/components/ui/notification-selector"
import { Check, Plus } from "lucide-react"
import { EventStatus } from "@/types/event"
import {
  CreateEventFormData,
  createEventFormSchema,
  UserReminder,
} from "@/schemas/event"
import { useIsMobile } from "@/hooks/use-mobile"
import { useEventById } from "@/http/hooks/event"
import { format } from "date-fns"
import { updateEvent } from "@/http/event/update-event"
import { CustomRadioButton } from "@/components/ui/custom-radio-button"
import { useLeads } from "@/http/hooks/lead"

interface FormComponentProps {
  setOpen(value: boolean): void
  handleOpenSuccess(): void
  processId?: string
  customerId?: string
}

function FormComponent({
  setOpen,
  handleOpenSuccess,
  processId,
  customerId,
}: FormComponentProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const searchParams = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const editEventId = searchParams.get("editEventId")

  const [typeUser, setTypeUser] = useState<"lead" | "customer">("customer")

  const {
    control,
    register,
    reset,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventFormSchema),
  })

  const selectedCustomerId = watch("customer_id")
  const startDate = watch("start_date")
  const startTime = watch("start_time")
  const endDate = watch("end_date")
  const endTime = watch("end_time")

  const { processs, mutate } = useProcess(
    page,
    undefined,
    undefined,
    selectedCustomerId || customerId
  )

  const { customers } = useCustomers({ page: 1 })

  const { leads } = useLeads(1)

  const { calendar } = useCalendar({ page })

  const { event } = useEventById(editEventId ?? "")

  useEffect(() => {
    if (event) {
      const start_date = event?.start_time
        ? format(event.start_time, "yyyy-MM-dd")
        : ""
      const end_date = event?.end_time
        ? format(event.end_time, "yyyy-MM-dd")
        : ""

      if (event?.lead && !event?.customer) {
        setTypeUser("lead")
      }

      reset({
        calendar_id: event?.calendar?._id,
        type: event?.type,
        title: event?.title,
        description: event?.description,
        customer_id: event?.customer?._id ?? null,
        lead_id: event?.lead?._id ?? null,
        process_id: event?.process?._id,
        status: event?.status,
        start_date: start_date ?? "",
        end_date: end_date ?? "",
        start_time: event?.custom_start_time ?? "",
        end_time: event?.custom_end_time ?? "",
        user_reminder: event?.user_reminder || [],
        consultation_mode: event?.consultation_mode as "online" | "in_person",
      })
    } else if (processId || customerId) {
      reset((prev) => ({
        ...prev,
        ...(processId && { process_id: processId }),
        ...(customerId && { customer_id: customerId }),
      }))
    }
  }, [event, reset, processId, customerId])

  useEffect(() => {
    if (!editEventId && selectedCustomerId && !processId) {
      setValue("process_id", null)
    }
  }, [selectedCustomerId, setValue, editEventId, processId])

  useEffect(() => {
    if (calendar && calendar.length > 0 && !editEventId) {
      const currentCalendarId = watch("calendar_id")
      if (!currentCalendarId) {
        setValue("calendar_id", calendar[0]._id)
      }
    }
  }, [calendar, setValue, editEventId, watch])

  useEffect(() => {
    if (editEventId) return

    if (startDate && !endDate) {
      setValue("end_date", startDate)
    }
  }, [startDate, endDate, setValue, editEventId])

  useEffect(() => {
    if (editEventId) return

    if (startTime && startDate && !endTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(startTime)) return

      const startDateTime = new Date(`${startDate}T${startTime}`)

      if (isNaN(startDateTime.getTime())) return

      const endDateTime = new Date(startDateTime)
      endDateTime.setHours(endDateTime.getHours() + 1)

      const formattedEndTime = endDateTime.toTimeString().slice(0, 5)
      setValue("end_time", formattedEndTime)

      if (endDateTime.getDate() !== startDateTime.getDate()) {
        const endDateObj = new Date(startDate)
        endDateObj.setDate(endDateObj.getDate() + 1)
        setValue("end_date", endDateObj.toISOString().split("T")[0])
      }
    }
  }, [startTime, startDate, endDate, endTime, setValue, editEventId])

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete("editEventId")
    params.delete("newEvent")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const onSubmit: SubmitHandler<CreateEventFormData> = async (data) => {
    try {
      const {
        customer_id,
        process_id,
        type,
        title,
        description,
        status,
        calendar_id,
        end_date,
        start_date,
        start_time,
        end_time,
        user_reminder,
        consultation_mode,
      } = data

      const startDateTime = new Date(`${start_date}T${start_time}`)
      const endDateTime = new Date(`${end_date}T${end_time}`)

      const credentials = {
        calendar_id,
        process_id: process_id ?? null,
        customer_id: customer_id ?? null,
        consultation_mode,
        type,
        title,
        description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status,
        user_reminder: user_reminder || [],
      }

      let result: any

      if (editEventId) {
        result = await updateEvent({
          eventId: editEventId,
          ...credentials,
        })
      } else {
        result = await createEvent(credentials)
      }

      if (!result.success) {
        setHasError(true)
        setErrorMessage(JSON.stringify(result.error.message))

        return
      }

      if (editEventId) {
        const params = new URLSearchParams(searchParams)
        params.delete("editEventId")
        router.push(`/event?${params.toString()}`)

        mutate()

        handleOpenSuccess()

        return
      }

      handleClose()

      mutate()

      setOpen(false)

      handleOpenSuccess()
    } catch (error) {
      console.error("Erro ao processar evento:", error)
    }
  }

  const handleNewCustomer = () => {
    const currentPath = window.location.pathname
    const currentParams = new URLSearchParams(searchParams.toString())
    currentParams.set("editEventId", editEventId || "")
    const pathWithParams = `${currentPath}?${currentParams.toString()}`
    router.push(
      `/customer?createCustomer=true&returnTo=${encodeURIComponent(
        pathWithParams
      )}`
    )
  }

  const handleNewLead = () => {
    const currentPath = window.location.pathname
    const currentParams = new URLSearchParams(searchParams.toString())
    currentParams.set("editEventId", editEventId || "")
    const pathWithParams = `${currentPath}?${currentParams.toString()}`
    router.push(
      `/lead?createLead=true&returnTo=${encodeURIComponent(pathWithParams)}`
    )
  }

  const handleDeleteEvent = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("deleteEventId", editEventId || "")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="px-4 pb-6 w-full h-screen overflow-y-scroll"
    >
      <div className="mt-10 flex flex-col gap-3">
        <div className="flex gap-2">
          <Icon
            icon="mdi:add-circle-outline"
            className="text-[#BBE2E7] w-[30px] h-[30px]"
          />

          <h3 className="text-xl text-[#3D3D3D] font-bold">
            {editEventId ? "Editar evento" : "Novo evento"}
          </h3>
        </div>

        <p className="text-base text-[#BDBDBD]">
          {editEventId
            ? "Preencha os campos abaixo para editar o evento"
            : "Preencha os campos abaixo para cadastrar o novo evento"}
        </p>
      </div>

      <div className="flex flex-col gap-5 mt-10">
        <div className="flex flex-col gap-2">
          <Controller
            name="calendar_id"
            control={control}
            rules={{
              required: "Agenda é obrigatório",
              validate: (value) => {
                if (value === "new_agenda") {
                  return "Por favor, selecione uma agenda válida"
                }
                return true
              },
            }}
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Agenda"
                options={[
                  ...calendar?.map((agenda: Calendar) => ({
                    value: agenda?._id,
                    label: agenda?.title,
                  })),
                  {
                    value: "new_agenda",
                    label: "+ Nova agenda",
                  },
                ]}
                value={value === "new_agenda" ? "" : value}
                onChange={(e: any) => {
                  if (e === "new_agenda") {
                    window.open("/setting/agenda/new", "_blank")
                    return
                  }
                  onChange(e)
                }}
                iconName="calendarCheck"
              />
            )}
          />

          {errors?.calendar_id && (
            <p className="text-xs font-medium text-red-500 dark:text-red-400">
              {errors?.calendar_id?.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Controller
            name="type"
            control={control}
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Tipo de evento"
                options={eventyOptions}
                value={value}
                onChange={(e: any) => {
                  onChange(e)
                }}
                iconName="triangleSquareCircle"
              />
            )}
          />

          {errors?.type && (
            <p className="text-xs font-medium text-red-500 dark:text-red-400">
              {errors?.type?.message}
            </p>
          )}
        </div>

        <Input
          {...register("title")}
          iconName="edit"
          placeholder="Insira o título do evento"
          label="Título"
          error={errors?.title}
        />

        <div className="flex flex-col gap-2">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <CustomTextarea
                {...field}
                label="Descrição"
                placeholder="Insira uma breve descrição sobre o evento..."
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          {errors?.description && (
            <p className="text-xs font-medium text-red-500 dark:text-red-400">
              {errors?.description?.message}
            </p>
          )}
        </div>

        {typeUser === "customer" ? (
          <div className="flex flex-col gap-2">
            <Controller
              name="customer_id"
              control={control}
              render={({ field: { onChange, value } }) => (
                <CustomSelectWithNewAction
                  label="Cliente"
                  options={customers?.map((customer: Customer) => ({
                    value: customer?._id,
                    label: formatName(customer?.name),
                  }))}
                  value={value ?? ""}
                  onChange={
                    customerId || processId
                      ? undefined
                      : (e: any) => {
                          onChange(e)
                        }
                  }
                  iconName="person"
                  disabled={!!customerId || !!processId}
                  onNewAction={handleNewCustomer}
                  newActionLabel="Novo Cliente"
                />
              )}
            />

            {errors?.customer_id && (
              <p className="text-xs font-medium text-red-500 dark:text-red-400">
                {errors?.customer_id?.message}
              </p>
            )}
          </div>
        ) : null}

        {typeUser === "lead" && (
          <div className="flex flex-col gap-2">
            <Controller
              name="lead_id"
              control={control}
              render={({ field: { onChange, value } }) => (
                <CustomSelectWithNewAction
                  label="Lead"
                  options={leads?.map((lead) => ({
                    value: lead?._id,
                    label: formatName(lead?.name),
                  }))}
                  value={value ?? ""}
                  onChange={
                    customerId || processId
                      ? undefined
                      : (e: any) => {
                          onChange(e)
                        }
                  }
                  iconName="person"
                  disabled={!!customerId || !!processId}
                  onNewAction={handleNewLead}
                  newActionLabel="Novo Lead"
                />
              )}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Controller
            name="process_id"
            control={control}
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Processo"
                options={
                  selectedCustomerId || customerId
                    ? processs.map((process) => ({
                        value: process._id,
                        label: process.number,
                      }))
                    : []
                }
                value={value ?? ""}
                onChange={
                  processId
                    ? undefined
                    : (e: any) => {
                        onChange(e === "" ? null : e)
                      }
                }
                iconName="folder"
                disabled={!!processId || (!selectedCustomerId && !customerId)}
                placeholder={
                  !selectedCustomerId && !customerId
                    ? "Selecione um cliente primeiro"
                    : "Selecione um processo"
                }
              />
            )}
          />

          {errors?.process_id && (
            <p className="text-xs font-medium text-red-500 dark:text-red-400">
              {errors?.process_id?.message}
            </p>
          )}

          {(selectedCustomerId || customerId) && processs.length === 0 && (
            <p className="text-xs font-medium text-amber-600">
              Este cliente não possui processos cadastrados
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Controller
            name="status"
            control={control}
            defaultValue={EventStatus.PENDING}
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Status"
                options={statusOptions}
                value={value}
                onChange={(e: any) => {
                  onChange(e)
                }}
                iconName="person"
              />
            )}
          />

          {errors?.status && (
            <p className="text-xs font-medium text-red-500 dark:text-red-400">
              {errors?.status?.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Controller
            name="user_reminder"
            control={control}
            render={({ field: { onChange, value } }) => (
              <NotificationSelector
                label="Notificações"
                value={value || []}
                onChange={(reminders: UserReminder[]) => onChange(reminders)}
                eventId={editEventId || undefined}
              />
            )}
          />

          {errors?.user_reminder && (
            <p className="text-xs font-medium text-red-500 dark:text-red-400">
              {errors?.user_reminder?.message}
            </p>
          )}
        </div>

        <div>
          <h4 className="text-base text-[#707070] font-semibold">
            O evento é em qual modalidade?
          </h4>

          <div className="flex items-center gap-4 md:gap-10 mt-4 flex-wrap">
            <Controller
              name="consultation_mode"
              control={control}
              defaultValue="in_person"
              render={({ field }) => (
                <>
                  <CustomRadioButton
                    {...field}
                    label="Presencial"
                    value="in_person"
                    checked={field.value === "in_person"}
                    onChange={(e) => field.onChange(e)}
                  />
                  <CustomRadioButton
                    {...field}
                    label="Online"
                    value="online"
                    checked={field.value === "online"}
                    onChange={(e) => field.onChange(e)}
                  />
                </>
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2 max-md:flex-col items-end max-md:w-full">
            <div className="flex flex-col gap-2 max-md:w-full">
              <Controller
                name="start_date"
                control={control}
                render={({ field }) => (
                  <CustomDateSelect
                    label="Começa"
                    formatPattern="dd/MM/yy"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              {errors?.start_date && (
                <p className="text-xs font-medium text-red-500 dark:text-red-400">
                  {errors?.start_date?.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 max-md:w-full">
              <Controller
                name="start_time"
                control={control}
                render={({ field }) => (
                  <TimeInput
                    label=""
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              {errors?.start_time && (
                <p className="text-xs font-medium text-red-500 dark:text-red-400">
                  {errors?.start_time?.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-end gap-2 max-md:flex-col max-md:w-full">
            <div className="flex flex-col gap-2 max-md:w-full">
              <Controller
                name="end_date"
                control={control}
                render={({ field }) => (
                  <CustomDateSelect
                    label="Termina"
                    formatPattern="dd/MM/yy"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              {errors?.end_date && (
                <p className="text-xs font-medium text-red-500 dark:text-red-400">
                  {errors?.end_date?.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 max-md:w-full">
              <Controller
                name="end_time"
                control={control}
                render={({ field }) => (
                  <TimeInput
                    label=""
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              {errors?.end_time && (
                <p className="text-xs font-medium text-red-500 dark:text-red-400">
                  {errors?.end_time?.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex max-md:flex-col max-md:gap-4 items-center justify-between">
          {editEventId && (
            <CustomButton
              type="button"
              onClick={handleDeleteEvent}
              className="w-full lg:hidden py-3 cursor-pointer"
              variant="danger"
            >
              Excluir evento
            </CustomButton>
          )}

          <CustomButton
            type="button"
            onClick={handleClose}
            className="w-[251px] max-md:w-full cursor-pointer"
            variant="outline"
          >
            Cancelar
          </CustomButton>

          <CustomButton
            type="submit"
            className="px-10 max-md:w-full cursor-pointer"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            iconLeft={<Check />}
          >
            {editEventId ? "Salvar" : "Salvar evento"}
          </CustomButton>
        </div>
      </div>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title={
            editEventId ? "Erro ao editar evento" : "Erro ao cadastrar evento"
          }
          description={errorMessage}
        />
      )}
    </form>
  )
}

export function Form({
  processId,
  customerId,
}: {
  processId?: string
  customerId?: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [openSheet, setOpenSheet] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openSuccess, setOpenSuccess] = useState(false)

  const handleOpenSuccess = () => {
    setOpenSuccess(true)
  }

  const isMobile = useIsMobile()

  const searchParams = useSearchParams()
  const editEventId = searchParams.get("editEventId")
  const newEvent = searchParams.get("newEvent")

  useEffect(() => {
    if ((editEventId || newEvent) && isMobile) {
      setOpenDrawer(true)
    } else if ((editEventId || newEvent) && !isMobile) {
      setOpenSheet(true)
    }

    return () => {
      setOpenDrawer(false)
      setOpenSheet(false)
    }
  }, [editEventId, isMobile, newEvent])

  const handleChangeSheet = (value: boolean) => {
    if (!value) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("editEventId")
      params.delete("newEvent")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }

  const handleChangeDrawer = (value: boolean) => {
    if (!value) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("editEventId")
      params.delete("newEvent")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }

  const handleNewEventClick = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("editId")
    params.set("newEvent", "true")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div>
      <div className="h-full max-md:hidden">
        <Sheet open={openSheet} onOpenChange={handleChangeSheet}>
          <SheetTrigger asChild>
            <Button
              className="font-plus-jakarta-sans font-semibold cursor-pointer min-w-[160px]"
              iconLeft={<AiOutlinePlus size={20} />}
              onClick={handleNewEventClick}
            >
              Novo evento
            </Button>
          </SheetTrigger>

          <SheetContent className="min-w-[707px] rounded-tl-[24px] rounded-bl-[24px]">
            <SheetTitle className="sr-only">Novo evento</SheetTitle>

            <FormComponent
              setOpen={setOpenSheet}
              handleOpenSuccess={handleOpenSuccess}
              processId={processId}
              customerId={customerId}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="md:hidden">
        <Drawer open={openDrawer} onOpenChange={handleChangeDrawer}>
          <DrawerTrigger
            onClick={handleNewEventClick}
            className="md:hidden flex items-center justify-center fixed w-[56px] h-[56px] bottom-6 right-6 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg text-xl"
          >
            <Plus className="w-5 h-5" />
          </DrawerTrigger>

          <DrawerContent className="h-full">
            <DialogTitle className="sr-only">Novo evento</DialogTitle>

            <FormComponent
              setOpen={setOpenDrawer}
              handleOpenSuccess={handleOpenSuccess}
              processId={processId}
              customerId={customerId}
            />
          </DrawerContent>
        </Drawer>
      </div>

      {openSuccess && (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="successSolid"
          title="Sucesso!"
          description="As informações do evento foram salvas com sucesso."
        />
      )}
    </div>
  )
}

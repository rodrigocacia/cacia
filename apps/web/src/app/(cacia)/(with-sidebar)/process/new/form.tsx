/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Icon } from "@/components/icone"
import { AiOutlinePlus } from "react-icons/ai"

import { useIsMobile } from "@/hooks/use-mobile"

import { useCustomers } from "@/http/hooks/customer"
import { useProcess } from "@/http/hooks/process"
import { createProcess } from "@/http/process/create-process"

import { Customer } from "@/types/customer"
import { formatName } from "@/utils/formatters"
import { Process } from "@/types/process"

import {
  CreateProcessFormData,
  createProcessFormSchema,
} from "@/schemas/process"

import { DialogTitle } from "@radix-ui/react-dialog"

import { Button, Button as CustomButton } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { CustomSelectWithNewAction } from "@/components/ui/custom-select-with-new-action"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { Toast } from "@/components/ui/toast"

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { updateProcess } from "@/http/process/update-process"

interface FormComponentProps {
  setOpen(value: boolean): void
  handleOpenSuccess(): void
  process?: Process | null
  customerId?: string
}

function FormComponent({
  setOpen,
  handleOpenSuccess,
  process,
  customerId,
}: FormComponentProps) {
  const searchParams = useSearchParams()

  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("page") || ""

  const router = useRouter()
  const pathname = usePathname()

  const { mutate } = useProcess(page, search)

  const { customers } = useCustomers({ limit: 100, search: "" })

  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProcessFormData>({
    resolver: zodResolver(createProcessFormSchema),
  })

  useEffect(() => {
    const selectedCustomerId = searchParams.get("selectedCustomerId")

    if (process) {
      reset({
        customer_id: process.customer?._id,
        number: process.number,
        description: process.description,
      })
    } else if (customerId) {
      reset({
        customer_id: customerId,
        number: "",
        description: "",
      })
    } else if (selectedCustomerId) {
      reset({
        customer_id: selectedCustomerId,
        number: "",
        description: "",
      })
    }
  }, [process, customerId, reset, searchParams])

  const handleNewCustomer = () => {
    const currentPath = pathname
    const currentParams = new URLSearchParams(searchParams.toString())
    currentParams.set("newProcess", "true")
    const pathWithParams = `${currentPath}?${currentParams.toString()}`
    router.push(
      `/customer?createCustomer=true&returnTo=${encodeURIComponent(pathWithParams)}`
    )
  }

  const onSubmit: SubmitHandler<CreateProcessFormData> = async (data) => {
    try {
      const { customer_id, description, number } = data

      const credentials = {
        customer_id,
        description,
        number,
      }

      if (process) {
        const result = await updateProcess({
          ...credentials,
          process_id: process._id,
        })

        if (!result.success) {
          setHasError(true)
          setErrorMessage(JSON.stringify(result.error.message))

          return
        }

        mutate()

        setOpen(false)
        handleOpenSuccess()

        const params = new URLSearchParams(searchParams.toString())
        params.delete("editId")
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      } else {
        const result = await createProcess(credentials)

        if (!result.success) {
          setHasError(true)

          const errorMessage = Array.isArray(result.error)
            ? result.error.join(", ")
            : result.error?.message || "Erro desconhecido"

          setErrorMessage(errorMessage)

          return
        }

        mutate()

        setOpen(false)

        handleOpenSuccess()
      }
    } catch (err: any) {
      if (err.message === "Process with this number already exists") {
        const message = await err.response.json()

        if (message === "Process with this number already exists") {
          setError("number", {
            type: "manual",
            message: "Já existe uma processo com este nome.",
          })
        }

        return
      }
    }
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
            {process ? "Editar processo" : "Novo processo"}
          </h3>
        </div>

        <p className="text-base text-[#BDBDBD]">
          {process
            ? "Edite os campos abaixo para atualizar o processo"
            : "Preencha os campos abaixo para cadastrar o novo processo"}
        </p>
      </div>

      <div className="flex flex-col gap-5 mt-10">
        <Input
          iconName={null}
          {...register("number")}
          label="Número do Processo"
          error={errors?.number}
          mask="process"
          disabled={!!process}
        />

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
              value={value}
              onChange={(e: any) => {
                onChange(e)
              }}
              iconName="person"
              disabled={!!customerId}
              onNewAction={handleNewCustomer}
              newActionLabel="Novo Cliente"
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <CustomTextarea
              {...field}
              label="Descrição"
              placeholder="Insira uma breve descrição do processo..."
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />

        <div className="flex items-center justify-between">
          <CustomButton
            type="button"
            onClick={() => setOpen(false)}
            className="w-[251px] cursor-pointer"
            variant="outline"
          >
            Cancelar
          </CustomButton>

          <CustomButton
            type="submit"
            className="px-10 cursor-pointer"
            variant="primary"
            isLoading={isSubmitting}
          >
            {process ? "Atualizar processo" : "Salvar processo"}
          </CustomButton>
        </div>
      </div>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title={
            process
              ? "O processo não foi atualizado com sucesso."
              : "O processo não foi cadastrado com sucesso."
          }
          description={errorMessage}
        />
      )}
    </form>
  )
}

interface FormProps {
  process?: Process | null
  customerContext?: boolean
  customerId?: string
}

export function Form({
  process,
  customerContext = false,
  customerId,
}: FormProps) {
  const [openSuccess, setOpenSuccess] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const editId = searchParams.get("editId")

  const isMobile = useIsMobile()

  const newProcess = searchParams.get("newProcess")
  const shouldOpenModal = Boolean(editId || newProcess)
  const shouldOpenSheet = shouldOpenModal && !isMobile
  const shouldOpenDrawer = shouldOpenModal && isMobile

  const handleOpenSuccess = () => {
    setOpenSuccess(true)
  }

  const handleCloseModal = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("editId")
    params.delete("newProcess")
    params.delete("selectedCustomerId")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleChangeSheet = (value: boolean) => {
    if (!value) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("editId")
      params.delete("newProcess")
      params.delete("selectedCustomerId")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }

  const handleChangeDrawer = (value: boolean) => {
    if (!value) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("editId")
      params.delete("newProcess")
      params.delete("selectedCustomerId")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }

  const handleNewProcessClick = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("editId")
    params.set("newProcess", "true")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div>
      <div className="h-full max-md:hidden">
        <Sheet open={shouldOpenSheet} onOpenChange={handleChangeSheet}>
          <SheetTrigger asChild>
            {process ? (
              <Button
                className="cursor-pointer bg-transparent border border-[#348C98] w-full"
                iconLeft={
                  <Icon
                    icon="mdi:pencil"
                    className="text-[#348C98]"
                    width={20}
                    height={20}
                  />
                }
                onClick={handleNewProcessClick}
              >
                <span className="text-sm text-[#348C98]">Editar processo</span>
              </Button>
            ) : (
              <Button
                className="cursor-pointer"
                iconLeft={<AiOutlinePlus size={20} />}
                onClick={handleNewProcessClick}
              >
                Novo processo
              </Button>
            )}
          </SheetTrigger>

          <SheetContent className="min-w-[707px] rounded-tl-[24px] rounded-bl-[24px]">
            <SheetTitle className="sr-only">Novo processo</SheetTitle>

            <FormComponent
              setOpen={handleCloseModal}
              handleOpenSuccess={handleOpenSuccess}
              process={process}
              customerId={customerId}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="md:hidden">
        <Drawer open={shouldOpenDrawer} onOpenChange={handleChangeDrawer}>
          {customerContext && (
            <DrawerTrigger asChild>
              <button
                className="fixed w-[56px] h-[56px] bottom-6 right-6 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg text-xl z-50"
                onClick={handleNewProcessClick}
              >
                +
              </button>
            </DrawerTrigger>
          )}
          <DrawerContent className="h-full">
            <DialogTitle className="sr-only">Novo processo</DialogTitle>

            <FormComponent
              setOpen={handleCloseModal}
              handleOpenSuccess={handleOpenSuccess}
              process={process}
              customerId={customerId}
            />
          </DrawerContent>
        </Drawer>
      </div>

      {openSuccess && (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="successSolid"
          title={process ? "Processo atualizado!" : "Processo cadastrado!"}
          description={
            process
              ? "O processo foi atualizado com sucesso."
              : "O novo processo foi cadastrado com sucesso."
          }
        />
      )}
    </div>
  )
}

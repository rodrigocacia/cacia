/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Pencil, Plus } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"

import { useCustomers } from "@/http/hooks/customer"
import { useSWRConfig } from "swr"
import { createProcess } from "@/http/process/create-process"

import { Customer } from "@/types/customer"
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
import { mensagemDeErro } from "@/utils/error-handlers"
import {
  CabecalhoDoFormulario,
  RodapeDoFormulario,
} from "@/components/drawer-or-sheet/partes"

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

  const router = useRouter()
  const pathname = usePathname()

  // Revalida TODAS as listagens de processos, com qualquer filtro: a tabela
  // inclui o status na chave e o formulário não, então revalidar só a chave
  // "igual" deixava a lista parada até recarregar a página.
  const { mutate: mutateGlobal } = useSWRConfig()
  const mutate = () =>
    mutateGlobal((chave) => Array.isArray(chave) && chave[0] === "processs")

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
          setErrorMessage(mensagemDeErro(result.error))

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

          const errorMessage = mensagemDeErro(result.error)

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
      className="flex h-screen w-full flex-col gap-7 overflow-y-auto pb-6 max-md:h-[85vh]"
    >
      <CabecalhoDoFormulario
        rotulo="Processos"
        titulo={process ? "Editar processo" : "Novo processo"}
        descricao={
          process
            ? "Atualize os dados do processo."
            : "Preencha os campos abaixo para cadastrar o novo processo."
        }
      />

      <div className="flex flex-col gap-5">
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
                label: customer?.name,
              }))}
              value={value}
              onChange={(e: any) => {
                onChange(e)
              }}
              iconName="person"
              disabled={!!customerId || !!process}
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
      </div>

      <RodapeDoFormulario>
        <CustomButton
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer"
          variant="outline"
        >
          Cancelar
        </CustomButton>

        <CustomButton
          type="submit"
          className="cursor-pointer px-6"
          variant="primary"
          isLoading={isSubmitting}
        >
          {process ? "Atualizar processo" : "Salvar processo"}
        </CustomButton>
      </RodapeDoFormulario>

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
                className="h-9! cursor-pointer rounded-[9px]! px-3.5 text-[13.5px] font-medium"
                variant="outline"
                iconLeft={<Pencil size={15} strokeWidth={1.7} />}
                onClick={handleNewProcessClick}
              >
                Editar processo
              </Button>
            ) : (
              <Button
                className={
                  customerContext
                    ? "h-9! cursor-pointer rounded-[9px]! px-3.5 text-[13.5px]"
                    : "h-10! cursor-pointer px-4 text-[13.5px]"
                }
                iconLeft={<Plus size={16} strokeWidth={2} />}
                onClick={handleNewProcessClick}
              >
                Novo processo
              </Button>
            )}
          </SheetTrigger>

          <SheetContent className="min-w-[640px] px-8">
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
                aria-label="Novo processo"
                className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-acao text-white shadow-[0_10px_24px_rgba(21,19,17,0.22)] transition-colors hover:bg-acao-escura"
                onClick={handleNewProcessClick}
              >
                <Plus className="h-5 w-5" strokeWidth={2} />
              </button>
            </DrawerTrigger>
          )}
          <DrawerContent className="h-full px-4">
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

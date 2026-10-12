/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useRef, useState } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Icon } from "@/components/icone"
import { AiOutlinePlus } from "react-icons/ai"

import { updateService } from "@/http/service/update-service"
import { createService } from "@/http/service/create-service"

import { areaOptions } from "@/constants/options"

import {
  CreateServiceFormData,
  createServiceFormSchema,
} from "@/schemas/service"

import { DialogTitle } from "@radix-ui/react-dialog"

import { Button, Button as CustomButton } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { CustomSelect } from "@/components/ui/custom-select"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { Toast } from "@/components/ui/toast"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { CustomRadioButton } from "@/components/ui/custom-radio-button"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useService, useServiceById } from "@/http/hooks/service"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  convertCurrencyToNumber,
  formatNumberToCurrency,
} from "@/utils/formatters"
import { mensagemDeErro } from "@/utils/error-handlers"

interface FormComponentProps {
  setOpen(value: boolean): void
  handleOpenSuccess(): void
}

function FormComponent({ setOpen, handleOpenSuccess }: FormComponentProps) {
  const searchParams = useSearchParams()

  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search") || ""
  const editId = searchParams.get("editId")

  const router = useRouter()
  const pathname = usePathname()

  const { mutate } = useService(page, search)

  const { service } = useServiceById(editId ?? "")

  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceFormData>({
    shouldFocusError: true,
    resolver: zodResolver(createServiceFormSchema),
  })

  const valueType = watch("value_type")
  const taxOrAdditional = watch("tax_or_additional")

  useEffect(() => {
    if (service) {
      reset({
        title: service?.title,
        description: service?.description,
        area: service?.area,
        value_type: service?.value_type,
        value_fixed: formatNumberToCurrency(service?.value_fixed),
        value_float: formatNumberToCurrency(service?.value_float),
        tax_or_additional: service?.value_detail ? "yes" : "no",
        value_detail: service?.value_detail || null,
      })
    }
  }, [service, reset])

  const onSubmit: SubmitHandler<CreateServiceFormData> = async (data) => {
    try {
      const {
        title,
        description,
        area,
        value_type,
        value_fixed,
        value_float,
        value_detail,
      } = data

      const credentials = {
        title,
        description,
        area,
        value_type,
        value_fixed,
        value_float,
        value_detail,
      }

      if (service) {
        const result = await updateService({
          ...credentials,
          value_fixed: convertCurrencyToNumber(value_fixed),
          value_float:
            value_float && value_float.trim()
              ? convertCurrencyToNumber(value_float)
              : null,
          value_detail: value_detail ?? "",
          service_id: service?._id,
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
        const result = await createService({
          ...credentials,
          value_fixed: convertCurrencyToNumber(value_fixed),
          value_float:
            value_float && value_float.trim()
              ? convertCurrencyToNumber(value_float)
              : null,
          value_detail: value_detail ?? "",
        })

        if (!result.success) {
          setHasError(true)
          setErrorMessage(mensagemDeErro(result.error))

          return
        }

        mutate()

        setOpen(false)

        handleOpenSuccess()
      }
    } catch (err: any) {
      if (err.message === "Service with this title already exists") {
        const message = await err.response.json()

        if (message === "Service with this title already exists") {
          setError("title", {
            type: "manual",
            message: "Já existe um serviço com este nome.",
          })
        }

        return
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="px-2 md:px-4 pb-6 w-full overflow-y-scroll"
    >
      <div className="mt-10 flex flex-col gap-3">
        <div className="flex gap-2">
          <Icon
            icon="mdi:add-circle-outline"
            className="text-[#BBE2E7] w-[30px] h-[30px]"
          />

          <h3 className="text-xl text-[#1B1916] font-bold">
            {/* Pelo `editId`, e não pelo serviço carregado: enquanto ele chega,
                o título dizia "Novo" numa edição. */}
            {editId ? "Editar serviço" : "Novo serviço"}
          </h3>
        </div>

        <p className="text-base text-[#A39C93]">
          {service
            ? "Edite os campos para atualizar o serviço"
            : "Preencha os campos para cadastrar o novo serviço"}
        </p>
      </div>

      <div className="flex flex-col gap-5 mt-10">
        <div className="flex flex-col gap-2">
          <Controller
            name="area"
            control={control}
            render={({ field }) => (
              <CustomSelect
                {...field}
                label="Área do direito"
                options={areaOptions}
                value={field.value || ""}
                onChange={(e: any) => field.onChange(e)}
                iconName="law"
              />
            )}
          />

          {errors?.area && (
            <p className="text-xs font-medium text-red-500 dark:text-red-400">
              {errors?.area?.message}
            </p>
          )}
        </div>

        <Input
          {...register("title")}
          iconName="tag"
          label="Nome"
          placeholder="Insira o nome do serviço..."
          error={errors?.title}
        />

        <Controller
          name="description"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <CustomTextarea
              {...field}
              label="Descrição"
              placeholder="Insira uma breve descrição do serviço..."
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />

        <div>
          <h4 className="text-base text-[#57514A] font-semibold">
            Tipo cobrança
          </h4>

          <div className="flex items-center gap-4 md:gap-10 mt-6 flex-wrap">
            <Controller
              name="value_type"
              control={control}
              defaultValue="FIXED"
              render={({ field }) => (
                <>
                  <CustomRadioButton
                    {...field}
                    label="Valor fixo"
                    value="FIXED"
                    checked={field.value === "FIXED"}
                    onChange={(e) => field.onChange(e)}
                  />
                  <CustomRadioButton
                    {...field}
                    label="Valor flutuante"
                    value="FLOAT"
                    checked={field.value === "FLOAT"}
                    onChange={(e) => field.onChange(e)}
                  />
                </>
              )}
            />
          </div>
        </div>

        {valueType === "FIXED" && (
          <Input
            {...register("value_fixed")}
            iconName="money"
            mask="price"
            label="Valor fixo"
            placeholder="R$ 0,00"
            error={errors?.value_fixed}
          />
        )}

        {valueType === "FLOAT" && (
          <div className="flex gap-4 max-md:flex-col">
            <Input
              {...register("value_fixed")}
              iconName="money"
              mask="price"
              label="Valor inicial"
              placeholder="R$ 0,00"
              error={errors?.value_fixed}
            />

            <Input
              {...register("value_float")}
              iconName="money"
              mask="price"
              label="Valor final"
              placeholder="R$ 0,00"
              error={errors?.value_float}
            />
          </div>
        )}

        <div>
          <h4 className="text-base text-[#57514A] font-semibold">
            Taxa ou % adicional?
          </h4>

          <div className="flex items-center gap-4 md:gap-10 mt-6 flex-wrap">
            <Controller
              name="tax_or_additional"
              control={control}
              defaultValue="no"
              render={({ field }) => (
                <>
                  <CustomRadioButton
                    {...field}
                    label="Não"
                    value="no"
                    checked={field.value === "no"}
                    onChange={(e) => field.onChange(e)}
                  />

                  <CustomRadioButton
                    {...field}
                    label="Sim"
                    value="yes"
                    checked={field.value === "yes"}
                    onChange={(e) => field.onChange(e)}
                  />
                </>
              )}
            />
          </div>
        </div>

        {taxOrAdditional === "yes" && (
          <Input
            {...register("value_detail")}
            iconName="edit"
            label="Detalhe"
            placeholder="Insira o detalhe do adicional..."
            error={errors?.value_detail}
          />
        )}

        <div className="flex items-center justify-between gap-4 max-md:flex-col">
          <CustomButton
            type="button"
            onClick={() => setOpen(false)}
            className="w-full md:w-[251px] cursor-pointer"
            variant="outline"
          >
            Cancelar
          </CustomButton>

          <CustomButton
            type="submit"
            className="w-full md:w-auto px-10 cursor-pointer"
            variant="primary"
            isLoading={isSubmitting}
          >
            {editId ? "Atualizar serviço" : "Salvar serviço"}
          </CustomButton>
        </div>
      </div>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title={errorMessage}
          description={
            service
              ? "O serviço não foi atualizado com sucesso."
              : "O serviço não foi cadastrado com sucesso."
          }
        />
      )}
    </form>
  )
}

// O botão do cabeçalho abre o painel (desktop) ou a gaveta (celular); o
// antigo botão flutuante "+" duplicava essa entrada e saiu.
export function Form() {
  const [openSheet, setOpenSheet] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [openSuccess, setOpenSuccess] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const editId = searchParams.get("editId")

  const editProcessedRef = useRef(false)

  const isMobile = useIsMobile()

  useEffect(() => {
    if (editId) {
      if (isMobile) {
        setOpenDrawer(true)
      } else {
        setOpenSheet(true)
      }
    }

    if (!editId) {
      if (isMobile) {
        setOpenDrawer(false)
      } else {
        setOpenSheet(false)
      }
    }
  }, [editId, isMobile])

  const handleOpenSuccess = () => {
    setOpenSuccess(true)
  }

  const handleChangeSheet = (value: boolean) => {
    if (!value && editId) {
      setOpenSheet(value)

      const params = new URLSearchParams(searchParams.toString())
      params.delete("editId")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })

      editProcessedRef.current = false

      return
    }

    if (value && isMobile) {
      return
    }

    setOpenSheet(value)
  }

  const handleChangeDrawer = (value: boolean) => {
    if (!value && editId) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("editId")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })

      editProcessedRef.current = false
    }

    if (value && !isMobile) {
      return
    }

    setOpenDrawer(value)
  }

  const handleNewProcessClick = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("editId")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })

    editProcessedRef.current = false

    if (isMobile) {
      setOpenSheet(false)
      setOpenDrawer(true)
    } else {
      setOpenDrawer(false)
      setOpenSheet(true)
    }
  }

  return (
    <div>
      <div className="h-full">
        <Sheet open={openSheet} onOpenChange={handleChangeSheet}>
          <Button
            iconLeft={<AiOutlinePlus size={20} />}
            onClick={handleNewProcessClick}
          >
            Novo serviço
          </Button>

          <SheetContent className="w-full md:min-w-[707px] rounded-tl-[24px] rounded-bl-[24px] max-w-full">
            <SheetTitle className="sr-only">
              {editId ? "Editar serviço" : "Novo serviço"}
            </SheetTitle>

            <FormComponent
              setOpen={setOpenSheet}
              handleOpenSuccess={handleOpenSuccess}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="md:hidden">
        <Drawer
          modal={true}
          preventScrollRestoration
          repositionInputs={false}
          open={openDrawer}
          onOpenChange={handleChangeDrawer}
        >
          <DrawerContent className="h-[90vh]">
            <DialogTitle className="sr-only">
              {editId ? "Editar serviço" : "Novo serviço"}
            </DialogTitle>

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
          variant="successSolid"
          title="Serviço salvo com sucesso!"
          description="O serviço foi processado com sucesso."
        />
      )}
    </div>
  )
}

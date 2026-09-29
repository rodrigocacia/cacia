/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"

import { DialogTitle } from "@radix-ui/react-dialog"

import { Controller, SubmitHandler, useForm } from "react-hook-form"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Icon } from "@/components/icone"

import { AiOutlinePlus } from "react-icons/ai"

import { Button, Button as CustomButton } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { createDocument } from "@/http/document/create-document"
import { Toast } from "@/components/ui/toast"
import { useParams } from "next/navigation"
import { CustomSelect } from "@/components/ui/custom-select"
import { useCustomers } from "@/http/hooks/customer"
import { Customer } from "@/types/customer"
import { formatName } from "@/utils/formatters"
import { useProcess } from "@/http/hooks/process"
import { mensagemDeErro } from "@/utils/error-handlers"

export const areasDeAtuacao = [
  { value: "tecnologia", label: "Tecnologia" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "financas", label: "Finanças" },
  { value: "marketing", label: "Marketing" },
  { value: "design", label: "Design" },
  { value: "juridico", label: "Jurídico" },
  { value: "rh", label: "Recursos Humanos" },
]

const createDocumentFormSchema = z
  .object({
    title: z.string().min(1, { message: "Insira um titulo válido" }),
    linkToCustomerAndProcess: z.boolean(),
    customer_id: z.string().optional(),
    process_id: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.linkToCustomerAndProcess) {
      if (!data.customer_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione um cliente",
          path: ["customer_id"],
        })
      }
    }
  })

type CreateDocumentFormData = z.infer<typeof createDocumentFormSchema>

interface FormComponentProps {
  setOpen(value: boolean): void
  handleOpenSuccess(): void
  location?: "customer" | "process"
  customerId?: string
  processId?: string
}

function FormComponent({
  setOpen,
  handleOpenSuccess,
  location,
  customerId,
  processId,
}: FormComponentProps) {
  const [file, setFile] = useState<File | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const { customers } = useCustomers({ limit: 100 })
  const { processs } = useProcess(1)

  const params = useParams()

  const folder_id = params.id

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateDocumentFormData>({
    resolver: zodResolver(createDocumentFormSchema) as any,
    defaultValues: {
      linkToCustomerAndProcess: false,
    },
  })

  const linkToCustomerAndProcess = watch("linkToCustomerAndProcess")

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
  }

  const onSubmit: SubmitHandler<CreateDocumentFormData> = async (data) => {
    try {
      const { title, customer_id, process_id } = data

      if (!file) return

      let folderId = null

      if (!location) {
        folderId = folder_id
      }

      const documentData = {
        title,
        file,
        folder_id: folderId ? String(folderId) : null,
        customer_id: location === "customer" ? customerId : customer_id,
        process_id: location === "process" ? processId : process_id,
      }

      // Sem conferir o resultado, uma falha no envio (storage fora do ar,
      // arquivo grande demais) aparecia como "adicionado com sucesso".
      const resultado = await createDocument(documentData)

      if (!resultado.success) {
        setErro(mensagemDeErro(resultado.error))
        return
      }

      setOpen(false)
      handleOpenSuccess()
    } catch {}
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="px-4 pb-6 w-full h-screen overflow-y-scroll"
    >
      {erro && (
        <Toast
          onClose={() => setErro(null)}
          variant="error"
          title="Não foi possível salvar"
          description={erro}
        />
      )}

      <div className="mt-10 flex flex-col gap-3">
        <div className="flex gap-2">
          <Icon
            icon="mdi:add-circle-outline"
            className="text-[#BBE2E7] w-[30px] h-[30px]"
          />

          <h3 className="text-xl text-[#3D3D3D] font-bold">Novo documento</h3>
        </div>

        <p className="text-base text-[#BDBDBD]">
          Preencha os campos abaixo para adicionar um novo documento
        </p>
      </div>

      <div className="flex flex-col gap-5 mt-10">
        <div className="w-full flex items-center gap-3">
          <Controller
            name="linkToCustomerAndProcess"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Switch checked={value} onCheckedChange={onChange} />
            )}
          />

          <h3>Vincular a um cliente e processo</h3>
        </div>

        {linkToCustomerAndProcess && (
          <div className="flex items-center max-md:flex-col gap-4">
            <div className="w-full">
              <Controller
                name="customer_id"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CustomSelect
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
                  />
                )}
              />

              {errors.customer_id && (
                <p className="text-sm text-red-500">
                  {errors.customer_id.message}
                </p>
              )}
            </div>

            <div className="w-full">
              <Controller
                name="process_id"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CustomSelect
                    label="Processo"
                    options={processs?.map((process: any) => ({
                      value: process?._id,
                      label: `${process?.number}`,
                    }))}
                    value={value}
                    onChange={(e: any) => {
                      onChange(e)
                    }}
                    iconName="folder"
                  />
                )}
              />

              {errors.process_id && (
                <p className="text-sm text-red-500">
                  {errors.process_id.message}
                </p>
              )}
            </div>
          </div>
        )}

        <Input
          {...register("title")}
          label="Nome"
          placeholder="Insira o nome do arquivo..."
          iconName="edit"
          error={errors?.title}
        />

        <div className="w-full flex flex-col gap-3.5 mt-4">
          <h3 className="text-base text-[#707070] font-semibold">
            Arquivos do processo
          </h3>

          <label
            htmlFor="file"
            className="w-full cursor-pointer flex bg-[#FCFCFD] border-2 border-dashed border-[#BBE2E7] rounded-[14px] pt-5 pb-6"
          >
            <input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpeg,.jpg,.png"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-full flex items-center flex-col gap-5">
              <Icon
                icon="mdi:cloud-upload"
                className="text-[#BBE2E7] w-11 h-11"
              />

              <div className="w-full flex items-center flex-col gap-2">
                <h3 className="text-sm text-[#BDBDBD] font-semibold">
                  Toque para fazer upload
                </h3>

                <p className="text-[12px] text-[#BDBDBD]">
                  PDF, DOC, DOCX, TXT, JPEG, PNG (máx. 10MB)
                </p>
              </div>
            </div>
          </label>
        </div>

        {file ? (
          <div className="w-full flex items-center justify-between px-2.5 py-3 border border-[#F6F6F9] rounded-[10px]">
            <div className="flex items-center gap-2.5">
              <Icon
                icon="mdi:file-pdf-box"
                className="w-7 h-7 text-[#348C98]"
              />

              <span className="text-sm text-gray-800">{file.name}</span>
            </div>

            <button className="cursor-pointer" onClick={handleRemoveFile}>
              <Icon
                icon="mdi:close"
                className="w-[18px] h-[18px] text-[#BDBDBD]"
              />
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <CustomButton
            onClick={() => setOpen(false)}
            type="button"
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
            Salvar
          </CustomButton>
        </div>
      </div>
    </form>
  )
}

interface FormProps {
  location?: "customer" | "process"
  customerId?: string
  processId?: string
}

export function Form({ location, customerId, processId }: FormProps) {
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
              className="cursor-pointer"
              iconLeft={<AiOutlinePlus size={20} />}
            >
              Novo documento
            </Button>
          </SheetTrigger>

          <SheetContent className="min-w-[707px] rounded-tl-[24px] rounded-bl-[24px]">
            <SheetTitle className="sr-only">Novo documento</SheetTitle>

            <FormComponent
              setOpen={setOpenSheet}
              handleOpenSuccess={handleOpenSuccess}
              location={location}
              customerId={customerId}
              processId={processId}
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

          <DrawerContent className="h-full">
            <DialogTitle className="sr-only">Novo documento</DialogTitle>

            <FormComponent
              setOpen={setOpenDrawer}
              handleOpenSuccess={handleOpenSuccess}
              location={location}
              customerId={customerId}
              processId={processId}
            />
          </DrawerContent>
        </Drawer>
      </div>

      {openSuccess ? (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="successSolid"
          title="Arquivo adicionado!"
          description="Os arquivos selecionados foram adicionados com sucesso."
        />
      ) : null}
    </div>
  )
}

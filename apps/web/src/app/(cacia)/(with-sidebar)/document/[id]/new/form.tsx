/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"

import { DialogTitle } from "@radix-ui/react-dialog"

import { Controller, SubmitHandler, useForm } from "react-hook-form"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Check, FileText, Plus, Upload, X } from "lucide-react"

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
import { useProcess } from "@/http/hooks/process"
import { mensagemDeErro } from "@/utils/error-handlers"
import {
  CabecalhoDoFormulario,
  RodapeDoFormulario,
  SecaoDoFormulario,
} from "@/components/drawer-or-sheet/partes"

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
      className="flex h-screen w-full flex-col gap-7 overflow-y-auto pb-6 max-md:h-[85vh]"
    >
      {erro && (
        <Toast
          onClose={() => setErro(null)}
          variant="error"
          title="Não foi possível salvar"
          description={erro}
        />
      )}

      <CabecalhoDoFormulario
        rotulo="Documentos"
        titulo="Novo documento"
        descricao="Envie o arquivo e, se quiser, vincule a um cliente e processo."
      />

      <div className="flex flex-col gap-5">
        <div className="flex w-full items-center gap-3">
          <Controller
            name="linkToCustomerAndProcess"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Switch checked={value} onCheckedChange={onChange} />
            )}
          />

          <h3 className="text-[14px] text-tinta">
            Vincular a um cliente e processo
          </h3>
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
                      label: customer?.name,
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
          <SecaoDoFormulario>Arquivo</SecaoDoFormulario>

          <label
            htmlFor="file"
            className="flex w-full cursor-pointer rounded-[14px] border border-dashed border-filete-forte bg-white pt-6 pb-6 transition-colors hover:border-acao hover:bg-nevoa/40"
          >
            <input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpeg,.jpg,.png"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-full flex items-center flex-col gap-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-nevoa text-turquesa-profundo">
                <Upload size={20} strokeWidth={1.7} />
              </span>

              <div className="w-full flex items-center flex-col gap-2">
                <h3 className="text-[14px] font-medium text-tinta">
                  Clique para escolher o arquivo
                </h3>

                <p className="text-xs text-tinta-3">
                  PDF, DOC, DOCX, TXT, JPEG, PNG (máx. 10MB)
                </p>
              </div>
            </div>
          </label>
        </div>

        {file ? (
          <div className="flex w-full items-center justify-between rounded-[10px] border border-filete bg-white px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <FileText
                size={18}
                strokeWidth={1.7}
                className="shrink-0 text-turquesa-profundo"
              />

              <span className="truncate text-[13.5px] text-tinta">
                {file.name}
              </span>
            </div>

            <button
              type="button"
              aria-label="Remover arquivo"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-tinta-3 hover:bg-gray-100 hover:text-tinta"
              onClick={handleRemoveFile}
            >
              <X size={16} />
            </button>
          </div>
        ) : null}
      </div>

      <RodapeDoFormulario>
        <CustomButton
          onClick={() => setOpen(false)}
          type="button"
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
          iconLeft={<Check size={16} />}
        >
          Salvar documento
        </CustomButton>
      </RodapeDoFormulario>
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
              className={
                location
                  ? "h-9! cursor-pointer rounded-[9px]! px-3.5 text-[13.5px]"
                  : "h-10! cursor-pointer px-4 text-[13.5px]"
              }
              iconLeft={<Plus size={16} strokeWidth={2} />}
            >
              Novo documento
            </Button>
          </SheetTrigger>

          <SheetContent className="min-w-[640px] px-8">
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
          <DrawerTrigger
            aria-label="Novo documento"
            className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-acao text-white shadow-[0_10px_24px_rgba(21,19,17,0.22)] transition-colors hover:bg-acao-escura md:hidden"
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
          </DrawerTrigger>

          <DrawerContent className="h-full px-4">
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

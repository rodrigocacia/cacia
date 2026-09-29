/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { HTTPError } from "ky"

import { Icon } from "@/components/icone"
import { Check } from "lucide-react"

import { SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { createLead } from "@/http/lead/create-lead"
import { useLeads } from "@/http/hooks/lead"

import { Lead } from "@/types/lead"

import { Button as CustomButton } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"

import { Toast } from "@/components/ui/toast"
import { updateLead } from "@/http/lead/update-lead"
import { InputPhone } from "@/components/ui/custom-input-phone"
import { DrawerOrSheet } from "@/components/drawer-or-sheet"
import { mensagemDeErro } from "@/utils/error-handlers"

const createLeadFormSchema = z.object({
  name: z.string().min(6, { message: "Insira um nome válido" }),
  remotejid: z.string().min(6, { message: "Insira pelo menos 6 letras" }),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
})

export type CreateLeadFormData = z.infer<typeof createLeadFormSchema>

interface FormComponentProps {
  handleOpenSuccess(): void
  lead: Lead | null
  handleClose(): void
}

function FormComponent({ handleOpenSuccess, lead }: FormComponentProps) {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const page = Number(searchParams.get("page")) || 1
  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""
  const returnTo = searchParams.get("returnTo")

  const { mutate } = useLeads(page, search, status)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadFormData>({
    defaultValues: {
      name: lead?.name,
      remotejid: lead?.remotejid,
      email: lead?.email,
    },
    resolver: zodResolver(createLeadFormSchema),
  })

  const onSubmit: SubmitHandler<CreateLeadFormData> = async (data) => {
    try {
      if (lead) {
        const result = await updateLead({
          ...data,
          email: data.email ?? "",
          leadId: lead._id,
        })

        if (!result.success) {
          setHasError(true)
          setErrorMessage(mensagemDeErro(result.error))

          return
        }

        mutate()

        handleOpenSuccess()

        const params = new URLSearchParams(searchParams.toString())
        params.delete("editLeadId")
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      } else {
        const result = await createLead({ ...data, email: data.email ?? "" })

        if (!result.success) {
          setHasError(true)
          setErrorMessage(mensagemDeErro(result.error))

          return
        }

        mutate()

        handleOpenSuccess()

        setTimeout(() => {
          if (returnTo) {
            const decodedReturnTo = decodeURIComponent(returnTo)
            const url = new URL(decodedReturnTo, window.location.origin)

            if (!url.searchParams.has("newProcess")) {
              url.searchParams.set("newProcess", "true")
            }
            router.push(url.pathname + url.search)
            return
          }

          // Sem isto o painel continuava aberto e preenchido depois de
          // salvar — e um segundo clique em Salvar esbarrava no telefone
          // repetido.
          handleClose()
        }, 100)
      }
    } catch (err: any) {
      if (err instanceof HTTPError) {
      }
    }
  }

  const handleClose = () => {
    const params = new URLSearchParams(searchParams)
    params.delete("editLeadId")
    params.delete("createLead")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="px-4 flex flex-col justify-between pb-6 w-full h-screen overflow-y-scroll"
    >
      <div className="flex flex-col gap-10">
        <div className="mt-10 flex flex-col gap-3">
          <div className="flex gap-2">
            <Icon
              icon="mdi:add-circle-outline"
              className="text-[#BBE2E7] w-[30px] h-[30px]"
            />

            <h3 className="text-xl text-[#3D3D3D] font-bold">
              {lead ? "Editar lead" : "Novo lead"}
            </h3>
          </div>

          <p className="text-base text-[#BDBDBD]">
            Preencha os campos abaixo para cadastrar o novo lead
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <Input
            {...register("name")}
            label="Nome"
            iconName="person"
            placeholder="Insira o nome do lead..."
            autoComplete="name"
            error={errors?.name}
          />

          <InputPhone
            control={control}
            name="remotejid"
            label="Telefone (WhatsApp)"
            placeholder="Insira o número de telefone do lead..."
            error={errors?.remotejid}
            disabled={Boolean(lead)}
            hint={
              lead
                ? "O telefone identifica o contato no WhatsApp e não pode ser alterado."
                : undefined
            }
          />

          <Input
            {...register("email")}
            label="E-mail"
            placeholder="Insira o e-mail do lead..."
            autoComplete="email"
            error={errors?.email}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <CustomButton
          type="button"
          className="w-[251px] cursor-pointer"
          variant="outline"
          onClick={handleClose}
        >
          Cancelar
        </CustomButton>

        <CustomButton
          type="submit"
          className="px-10 cursor-pointer"
          variant="primary"
          iconLeft={<Check />}
          isLoading={isSubmitting}
        >
          {lead ? "Editar" : "Salvar"}
        </CustomButton>
      </div>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao cadastrar o lead!"
          description={errorMessage}
        />
      )}
    </form>
  )
}

interface FormProps {
  lead: Lead | null
}

export function Form({ lead }: FormProps) {
  const [openSuccess, setOpenSuccess] = useState(false)

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const editLeadId = searchParams.get("editLeadId") ?? ""
  const createLead = searchParams.get("createLead") ?? ""

  const handleOpenSuccess = () => {
    setOpenSuccess(true)
  }

  const handleClose = () => {
    const params = new URLSearchParams(searchParams)
    params.delete("editLeadId")
    params.delete("createLead")
    router.push(`${pathname}?${params.toString()}`)
  }

  const isOpen = createLead || editLeadId

  function handleNewLead() {
    router.push("/lead?createLead=true")
  }

  return (
    <div>
      <DrawerOrSheet
        open={Boolean(isOpen)}
        close={handleClose}
        hasTrigger={true}
        triggerLabel="Novo lead"
        onTriggerClick={handleNewLead}
      >
        <FormComponent
          handleOpenSuccess={handleOpenSuccess}
          lead={lead}
          handleClose={handleClose}
        />
      </DrawerOrSheet>

      {openSuccess && (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="successSolid"
          title={lead ? "Lead editado!" : "Lead cadastrado!"}
          description={
            lead
              ? "O lead foi editado com sucesso."
              : "O novo lead foi cadastrado com sucesso."
          }
        />
      )}
    </div>
  )
}

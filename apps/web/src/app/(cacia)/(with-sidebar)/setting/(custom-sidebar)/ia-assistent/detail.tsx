"use client"

import { useState } from "react"

import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Icon } from "@iconify/react/dist/iconify.js"

import { Button } from "@/components/ui/custom-button"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { useAgents } from "@/http/hooks/agent"
import { Spinner } from "@/components/ui/sppiner"
import { updateAgent } from "@/http/agent/update-agent"
import { Toast } from "@/components/ui/toast"
import { CustomSelect } from "@/components/ui/custom-select"
import { AgentStyle } from "@/types/agent"
import { Check } from "lucide-react"

const agentStyle = [
  { value: AgentStyle.LEGAL_FORMAL, label: AgentStyle.LEGAL_FORMAL },
  {
    value: AgentStyle.CLEAR_AND_OBJECTIVE,
    label: AgentStyle.CLEAR_AND_OBJECTIVE,
  },
  {
    value: AgentStyle.ASSERTIVE_AND_PERSUASIVE,
    label: AgentStyle.ASSERTIVE_AND_PERSUASIVE,
  },
  {
    value: AgentStyle.EMPATHETIC_AND_SUPPORTIVE,
    label: AgentStyle.EMPATHETIC_AND_SUPPORTIVE,
  },
  {
    value: AgentStyle.PROFESSIONAL_AND_CASUAL,
    label: AgentStyle.PROFESSIONAL_AND_CASUAL,
  },
]

const iaAssistentFormSchema = z.object({
  style: z.string().min(4, { message: "Insira um estilo válido" }),
  greeting: z.string().min(4, { message: "Insira uma saudação válida" }),
})

export type IaAssistentFormData = z.infer<typeof iaAssistentFormSchema>

export function AssistantDetail() {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [success, setSuccess] = useState(false)

  const { agents, isLoading, mutate } = useAgents()

  const serviceAgent = agents?.find((agent) => agent.type === "personal")

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<IaAssistentFormData>({
    defaultValues: {
      style: serviceAgent?.style,
      greeting: serviceAgent?.greeting,
    },
    resolver: zodResolver(iaAssistentFormSchema),
  })

  const onSubmit: SubmitHandler<IaAssistentFormData> = async (data) => {
    try {
      const { style, greeting } = data

      const result = await updateAgent({
        agentId: serviceAgent?._id ?? "",
        style,
        greeting,
        whatsapp_connection: "oficial",
        whatsapp_api_key: "whatsapp_api_key",
      })

      if (!result.success) {
        setHasError(true)
        setErrorMessage(JSON.stringify(result.error.message))
        return
      }

      mutate()

      setSuccess(true)
    } catch {}
  }

  if (isLoading) return <Spinner />

  if (!serviceAgent) return <div>Nenhum agente de atendimento encontrado</div>

  return (
    <div className="p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm">
      <div className="flex items-center gap-3 max-md:mt-4">
        <Icon icon="mdi:robot-outline" className="w-8 h-8 text-[#BDBDBD]" />

        <h3 className="text-[20px] text-[#707070] font-bold">
          I.A. Assistente
        </h3>
      </div>

      <hr className="w-full my-4 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full mt-6 flex flex-col justify-between gap-8"
      >
        <div className="w-full flex flex-col gap-5">
          <Controller
            name="style"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Estilo de comunicação"
                options={agentStyle}
                iconName="work"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name="greeting"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <CustomTextarea
                {...field}
                label="Mensagem de Boas-vindas"
                aria-label="Saudação Inicial"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>

        <div className="w-full flex items-center justify-end max-md:flex-col max-md:gap-4 mt-8 max-md:pb-10 max-md:mt-8">
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
      </form>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao atualizar o assistente!"
          description={errorMessage}
        />
      )}

      {success && (
        <Toast
          onClose={() => setSuccess(false)}
          variant="successSolid"
          title="Assistente atualizado com sucesso!"
          description="O assistente foi atualizado com sucesso!"
        />
      )}
    </div>
  )
}

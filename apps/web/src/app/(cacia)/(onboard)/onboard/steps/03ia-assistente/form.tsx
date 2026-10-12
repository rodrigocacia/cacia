"use client"

import { useState } from "react"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, SubmitHandler, useForm } from "react-hook-form"

import { CustomTextarea } from "@/components/ui/custom-textarea"
import { useAgents } from "@/http/hooks/agent"
import { Spinner } from "@/components/ui/sppiner"
import { updateAgent } from "@/http/agent/update-agent"
import { Toast } from "@/components/ui/toast"
import { CustomSelect } from "@/components/ui/custom-select"
import { AgentStyle, agentStyleLabels } from "@/types/agent"
import { HeaderSteps } from "../components/header-steps"
import {
  BotaoAvancar,
  BotaoVoltar,
  RodapeDoPasso,
  SecaoDoPasso,
} from "../components/partes"
import { useOnboardingStore } from "@/stores/use-onboard-store"
import { mensagemDeErro } from "@/utils/error-handlers"

const agentStyle = [
  {
    value: AgentStyle.LEGAL_FORMAL,
    label: agentStyleLabels[AgentStyle.LEGAL_FORMAL],
  },
  {
    value: AgentStyle.CLEAR_AND_OBJECTIVE,
    label: agentStyleLabels[AgentStyle.CLEAR_AND_OBJECTIVE],
  },
  {
    value: AgentStyle.ASSERTIVE_AND_PERSUASIVE,
    label: agentStyleLabels[AgentStyle.ASSERTIVE_AND_PERSUASIVE],
  },
  {
    value: AgentStyle.EMPATHETIC_AND_SUPPORTIVE,
    label: agentStyleLabels[AgentStyle.EMPATHETIC_AND_SUPPORTIVE],
  },
  {
    value: AgentStyle.PROFESSIONAL_AND_CASUAL,
    label: agentStyleLabels[AgentStyle.PROFESSIONAL_AND_CASUAL],
  },
]

const iaAssistentFormSchema = z.object({
  style: z.string().min(4, { message: "Insira um estilo válido" }),
  greeting: z.string().min(4, { message: "Insira uma saudação válida" }),
})

export type IaAssistentFormData = z.infer<typeof iaAssistentFormSchema>

export function Form() {
  const { nextStep, prevStep } = useOnboardingStore()

  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [success, setSuccess] = useState(false)

  const { agents, isLoading, mutate } = useAgents()

  const serviceAgent = agents?.find((agent) => agent.type === "PERSONAL")

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
        setErrorMessage(mensagemDeErro(result.error))
        return
      }

      mutate()

      setSuccess(true)

      setTimeout(() => {
        nextStep()
      }, 1000)
    } catch {}
  }

  if (isLoading) return <Spinner />

  if (!serviceAgent) return <div>Nenhum agente de atendimento encontrado</div>

  return (
    <div className="flex w-full flex-col">
      <HeaderSteps />

      <SecaoDoPasso
        titulo="Assistente pessoal"
        descricao="Defina o estilo das comunicações internas."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col">
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

        <RodapeDoPasso>
          <BotaoVoltar onClick={() => prevStep()} />
          <BotaoAvancar isLoading={isSubmitting} />
        </RodapeDoPasso>
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

"use client"

import { useEffect, useState } from "react"

import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { AgentStyle, agentStyleLabels } from "@/types/agent"

import { CustomSelect } from "@/components/ui/custom-select"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { updateAgent } from "@/http/agent/update-agent"
import { useAgents } from "@/http/hooks/agent"
import { Spinner } from "@/components/ui/sppiner"
import { Toast } from "@/components/ui/toast"
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

  const serviceAgent = agents?.find((agent) => agent.type === "SUPPORT")

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<IaAssistentFormData>({
    defaultValues: {
      style: serviceAgent?.style,
      greeting: serviceAgent?.greeting,
    },
    resolver: zodResolver(iaAssistentFormSchema),
  })

  useEffect(() => {
    if (serviceAgent) {
      reset({
        style: serviceAgent.style,
        greeting: serviceAgent.greeting,
      })
    }
  }, [reset, serviceAgent])

  const onSubmit: SubmitHandler<IaAssistentFormData> = async (data) => {
    try {
      const { greeting, style } = data

      const result = await updateAgent({
        agentId: serviceAgent?._id ?? "",
        greeting,
        style,
        whatsapp_connection: "oficial",
        whatsapp_api_key: "whatsapp_api_key",
      })

      if (!result.success) {
        setHasError(true)
        setErrorMessage(mensagemDeErro(result.error))

        return
      }

      setSuccess(true)

      mutate()

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
        titulo="Assistente de atendimento"
        descricao="Defina o estilo e a mensagem inicial."
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
                placeholder="Olá, como posso ajudar?"
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
          title="Erro ao criar o assistente!"
          description={errorMessage}
        />
      )}

      {success && (
        <Toast
          onClose={() => setSuccess(false)}
          variant="successSolid"
          title="Assistente criado com sucesso!"
          description="O assistente foi criado com sucesso!"
        />
      )}
    </div>
  )
}

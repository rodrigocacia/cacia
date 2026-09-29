"use client"

import { useEffect, useState } from "react"

import { Icon } from "@/components/icone"

import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { AgentStyle, agentStyleLabels } from "@/types/agent"

import { Button } from "@/components/ui/custom-button"
import { CustomSelect } from "@/components/ui/custom-select"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { updateAgent } from "@/http/agent/update-agent"
import { useAgents } from "@/http/hooks/agent"
import { Spinner } from "@/components/ui/sppiner"
import { Toast } from "@/components/ui/toast"
import { HeaderSteps } from "../components/header-steps"
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
    <div className="bg-white relative z-10 w-full h-full max-lg:h-fit flex flex-col justify-center shadow-md rounded-r-4xl px-8 pt-[28px] max-lg:pb-4">
      <HeaderSteps />

      <div className="w-full flex flex-col gap-3 max-md:mt-4 mt-10">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:assistant" className="text-[#BDBDBD] w-8 h-8" />
          <h3 className="text-[20px] text-[#348C98] font-bold">
            I.A. Atendimento
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-normal text-[#3D3D3D]">
            Defina o estilo e a mensagem inicial.
          </p>
        </div>
      </div>

      <hr className="w-full my-4 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full mt-6 max-md:mt-4 flex flex-col justify-between gap-8"
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
                placeholder="Olá, como posso ajudar?"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>

        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-[251px] max-lg:w-full cursor-pointer"
              onClick={() => prevStep()}
              iconLeft={
                <Icon
                  icon="mdi:arrow-left"
                  className="w-6 h-6 text-[#707070]"
                />
              }
            >
              Voltar
            </Button>
          </div>

          <Button
            type="submit"
            className="w-[251px] max-lg:w-fit cursor-pointer"
            variant="primary"
            isLoading={isSubmitting}
            iconRight={
              !isSubmitting ? (
                <Icon icon="mdi:arrow-right" className="w-6 h-6 text-white" />
              ) : null
            }
          >
            Prosseguir
          </Button>
        </div>
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

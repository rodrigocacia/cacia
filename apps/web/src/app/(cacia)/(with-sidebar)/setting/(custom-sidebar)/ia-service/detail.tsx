"use client"

import { useState } from "react"

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
import { Check } from "lucide-react"
import { mensagemDeErro } from "@/utils/error-handlers"

import { Cartao, RodapeDoCartao } from "../../_ui/cartao"

// O rótulo em português vem do mapa central; o valor continua o enum da API
const agentStyle = Object.values(AgentStyle).map((estilo) => ({
  value: estilo,
  label: agentStyleLabels[estilo],
}))

const iaAssistentFormSchema = z.object({
  style: z.string().min(4, { message: "Insira um estilo válido" }),
  greeting: z.string().min(4, { message: "Insira uma saudação válida" }),
})

export type IaAssistentFormData = z.infer<typeof iaAssistentFormSchema>

export function ServiceDetail() {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [success, setSuccess] = useState(false)

  const { agents, isLoading, mutate } = useAgents()

  const serviceAgent = agents?.find((agent) => agent.type === "SUPPORT")

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
    } catch {}
  }

  if (isLoading) return <Spinner />

  if (!serviceAgent) {
    return (
      <Cartao titulo="Atendimento">
        <p className="text-[13.5px] text-tinta-3">
          Nenhum assistente encontrado.
        </p>
      </Cartao>
    )
  }

  return (
    <Cartao
      titulo="Atendimento"
      descricao="Como o assistente fala com quem chega pelo WhatsApp."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-7"
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
                label="Mensagem de boas-vindas"
                aria-label="Saudação Inicial"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </div>

        <RodapeDoCartao>
          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="px-5"
            variant="primary"
            iconLeft={<Check size={16} />}
          >
            Salvar
          </Button>
        </RodapeDoCartao>
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
    </Cartao>
  )
}

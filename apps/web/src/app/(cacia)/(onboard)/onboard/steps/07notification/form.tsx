"use client"

import { useOnboardingStore } from "@/stores/use-onboard-store"

import { HeaderSteps } from "../components/header-steps"
import {
  BotaoAvancar,
  BotaoVoltar,
  RodapeDoPasso,
  SecaoDoPasso,
} from "../components/partes"
import { CardNotification } from "@/app/(cacia)/(with-sidebar)/setting/(custom-sidebar)/notifications/components/card-notification"
import { updateSetting } from "@/http/setting/update-setting"
import { SubmitHandler, useForm } from "react-hook-form"
import { SettinFormData, settingFormSchema } from "@/schemas/setting"
import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSetting } from "@/http/hooks/setting"
import { Toast } from "@/components/ui/toast"
import { useRouter } from "next/navigation"
import { useOfficeById } from "@/http/hooks/office"
import { updateOffice } from "@/http/office/udpate-office"
import { Spinner } from "@/components/ui/sppiner"
import { mensagemDeErro } from "@/utils/error-handlers"
import { useConnection } from "@/http/hooks/connection"
import { isConnectionWorking } from "@/utils/connection-status"

export function Form() {
  const { prevStep, resetStep } = useOnboardingStore()

  const router = useRouter()

  const [hasSuccess, setHasSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const { mutate, settings } = useSetting(1)

  const { office } = useOfficeById()

  // O aviso de WhatsApp desconectado aparece uma vez, no topo — antes cada
  // cartão repetia o próprio selo.
  const { connection } = useConnection()
  const whatsappConectado = isConnectionWorking(connection)

  const isLoading = settings.length === 0 || !office

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<SettinFormData>({
    resolver: zodResolver(settingFormSchema),
  })

  useEffect(() => {
    if (settings.length > 0) {
      reset({
        n_w_c_new_event: settings[0]?.n_w_c_new_event ?? false,
        n_w_c_update_process: settings[0]?.n_w_c_update_process ?? false,
        n_w_a_new_lead: settings[0]?.n_w_a_new_lead ?? false,
        n_w_a_new_mark_lead: settings[0]?.n_w_a_new_mark_lead ?? false,
        n_w_a_new_mark_customer: settings[0]?.n_w_a_new_mark_customer ?? false,
        n_w_a_new_event: settings[0]?.n_w_a_new_event ?? false,
        n_w_a_update_process: settings[0]?.n_w_a_update_process ?? false,
        n_w_a_update_system: settings[0]?.n_w_a_update_system ?? false,
      })
    }
  }, [reset, settings])

  if (isLoading) {
    return <Spinner />
  }

  const onSubmit: SubmitHandler<SettinFormData> = async (data) => {
    try {
      const {
        n_w_c_new_event,
        n_w_c_update_process,
        n_w_a_new_lead,
        n_w_a_new_mark_lead,
        n_w_a_new_mark_customer,
        n_w_a_new_event,
        n_w_a_update_process,
        n_w_a_update_system,
      } = data

      const credentials = {
        n_w_c_new_event,
        n_w_c_update_process,
        n_w_a_new_lead,
        n_w_a_new_mark_lead,
        n_w_a_new_mark_customer,
        n_w_a_new_event,
        n_w_a_update_process,
        n_w_a_update_system,
      }

      const result = await updateSetting({
        setting_id: settings[0]._id,
        ...credentials,
      })

      if (!result.success) {
        setHasError(true)
        setErrorMessage(mensagemDeErro(result.error))

        return
      }

      setHasSuccess(true)

      mutate()

      const resultUpdateOffice = await updateOffice({
        name: office?.name ?? "",
        trade_name: office?.trade_name ?? "",
        description: office?.description ?? "",
        onboarding: true,
      })

      if (!resultUpdateOffice) {
        setHasError(true)
        setErrorMessage(mensagemDeErro(result.error))

        return
      }

      setTimeout(() => {
        resetStep()
        router.push("/dashboard")
      }, 1000)
    } catch {}
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col">
      <HeaderSteps />

      <SecaoDoPasso
        titulo="Notificações via WhatsApp"
        descricao="Escolha quando você e seus clientes devem ser notificados via WhatsApp."
      />

      {!whatsappConectado && (
        <p className="rounded-[12px] bg-ambar-fundo px-4 py-3 text-[13.5px] text-ambar">
          Conecte seu WhatsApp para ativar as notificações.
        </p>
      )}

      <h3 className="rotulo mt-7">Para clientes</h3>

      <div className="mt-3 flex flex-col rounded-[14px] border border-filete bg-white px-5 py-4">
        <CardNotification
          name="n_w_c_new_event"
          control={control}
          title="Novo evento"
          description="Envie alertas de novos eventos do cliente."
        />
        <CardNotification
          name="n_w_c_update_process"
          control={control}
          title="Atualização processual"
          description="Avise sobre novidades no processo."
        />
      </div>

      <h3 className="rotulo mt-7">Para administradores</h3>

      <div className="mt-3 flex flex-col rounded-[14px] border border-filete bg-white px-5 py-4">
        <CardNotification
          name="n_w_a_new_lead"
          control={control}
          title="Novo atendimento de lead"
          description="Receba alertas de novos leads."
        />
        <CardNotification
          name="n_w_a_new_mark_lead"
          control={control}
          title="Novo feedback de lead"
          description="Receba feedbacks coletados."
        />
        <CardNotification
          name="n_w_a_new_mark_customer"
          control={control}
          title="Novo feedback de cliente"
          description="Receba feedbacks coletados."
        />
        <CardNotification
          name="n_w_a_new_event"
          control={control}
          title="Novo evento"
          description="Receba alertas de novos eventos"
        />
        <CardNotification
          name="n_w_a_update_process"
          control={control}
          title="Atualização processual"
          description="Avise sobre novidades no processo."
        />
        <CardNotification
          name="n_w_a_update_system"
          control={control}
          title="Atualizações do sistema"
          description="Saiba sobre melhorias da plataforma."
        />
      </div>

      <RodapeDoPasso>
        <BotaoVoltar onClick={() => prevStep()} />
        <BotaoAvancar isLoading={isSubmitting}>Ir para o painel</BotaoAvancar>
      </RodapeDoPasso>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao atualizar notificações"
          description={errorMessage}
        />
      )}

      {hasSuccess && (
        <Toast
          onClose={() => setHasSuccess(false)}
          variant="successSolid"
          title="Notificações atualizadas com sucesso"
          description="As notificações foram atualizadas com sucesso"
        />
      )}
    </form>
  )
}

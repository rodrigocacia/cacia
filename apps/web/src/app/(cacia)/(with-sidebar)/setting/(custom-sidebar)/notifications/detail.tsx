"use client"

import { useEffect, useState } from "react"

import { Icon } from "@/components/icone"
import { Check } from "lucide-react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { SettinFormData, settingFormSchema } from "@/schemas/setting"
import { Button } from "@/components/ui/custom-button"
import { CardNotification } from "./components/card-notification"
import { useSetting } from "@/http/hooks/setting"
import { updateSetting } from "@/http/setting/update-setting"
import { Toast } from "@/components/ui/toast"

export function AdministratorDetail() {
  const [hasSuccess, setHasSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const { mutate, settings } = useSetting(1)

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
        setErrorMessage(JSON.stringify(result.error.message))

        return
      }

      setHasSuccess(true)

      mutate()
    } catch {}
  }

  return (
    <form
      className="p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex items-center gap-3 max-md:mt-4">
        <Icon
          icon="mdi:message-notification-outline"
          className="w-8 h-8 text-[#BDBDBD]"
        />
        <h3 className="text-[20px] text-[#707070] font-bold">
          Notificações via WhatsApp
        </h3>
      </div>

      <hr className="w-full my-4 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <div className="flex mt-5 items-center gap-3">
        <Icon
          icon="ic:outline-person"
          className="w-[26px] h-[26px] text-[#BDBDBD]"
        />
        <h3 className="text-[18px] text-[#707070] font-bold">Para Clientes</h3>
      </div>

      <hr className="w-full my-[11px] max-md:my-2 h-px border-t-0 bg-gray-200" />

      <div className="mt-8 flex flex-col gap-2.5">
        <CardNotification
          name="n_w_c_new_event"
          control={control}
          title="Novo evento"
          description="Envie alertas de novos eventos que incluem os clientes"
        />
        <CardNotification
          name="n_w_c_update_process"
          control={control}
          title="Atualização processual"
          description="Envie alertas de novas atualizações aos processos dos clientes"
        />
      </div>

      <div className="flex mt-5 items-center gap-3">
        <Icon
          icon="ic:outline-admin-panel-settings"
          className="w-[26px] h-[26px] text-[#BDBDBD]"
        />
        <h3 className="text-[18px] text-[#707070] font-bold">
          Para Administradores
        </h3>
      </div>

      <hr className="w-full my-[11px] max-md:my-2 h-px border-t-0 bg-gray-200" />

      <div className="mt-8 flex flex-col gap-2.5">
        <CardNotification
          name="n_w_a_new_lead"
          control={control}
          title="Novo atendimento Lead"
          description="Receba alertas de novos leads sendo atendidos"
        />
        <CardNotification
          name="n_w_a_new_mark_lead"
          control={control}
          title="Novo Feedback de Lead"
          description="Receba alertas de feedbacks coletados em atendimentos de Leads"
        />
        <CardNotification
          name="n_w_a_new_mark_customer"
          control={control}
          title="Novo Feedback de Cliente"
          description="Receba alertas de feedbacks coletados em atendimentos com clientes"
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
          description="Receba alertas de novas atualizações aos processos dos clientes"
        />
        <CardNotification
          name="n_w_a_update_system"
          control={control}
          title="Atualizações do Sistema"
          description="Receba alertas sobre melhorias da plataforma"
        />
      </div>

      <div className="w-full flex items-center justify-end max-md:flex-col max-md:gap-4 mt-8 max-md:pb-10">
        <Button
          type="submit"
          className="px-10 cursor-pointer max-md:w-full"
          variant="primary"
          iconLeft={<Check />}
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          Salvar
        </Button>
      </div>

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

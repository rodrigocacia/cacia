"use client"

import { useOnboardingStore } from "@/stores/use-onboard-store"

import { HeaderSteps } from "../components/header-steps"
import { Button } from "@/components/ui/custom-button"
import { CardNotification } from "@/app/(cacia)/(with-sidebar)/setting/(custom-sidebar)/notifications/components/card-notification"
import { Icon } from "@iconify/react/dist/iconify.js"
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

export function Form() {
  const { prevStep, resetStep } = useOnboardingStore()

  const router = useRouter()

  const [hasSuccess, setHasSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const { mutate, settings } = useSetting(1)

  const { office } = useOfficeById()

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
        setErrorMessage(JSON.stringify(result.error.message))

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
        setErrorMessage(JSON.stringify(result.error.message))

        return
      }

      setTimeout(() => {
        resetStep()
        router.push("/dashboard")
      }, 1000)
    } catch {}
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white relative z-10 w-full h-full max-lg:h-fit flex flex-col justify-center shadow-md rounded-r-4xl px-8 pt-[28px] max-lg:pb-4"
    >
      <HeaderSteps />

      <div className="w-full flex flex-col gap-3 max-md:mt-4 mt-10">
        <div className="flex items-center gap-2">
          <Icon
            icon="mdi:message-notification-outline"
            className="w-8 h-8 text-[#BDBDBD]"
          />
          <h3 className="text-[20px] text-[#348C98] font-bold">
            Notificações via WhatsApp
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-normal text-[#3D3D3D]">
            Escolha quando você e seus clientes devem ser notificados via
            WhatsApp.
          </p>
        </div>
      </div>

      <div className="w-full mt-4 p-3 bg-[#FFF3CD] border border-[#FFEAA7] rounded-lg">
        <p className="text-sm text-[#856404] text-center">
          Conecte seu WhatsApp para ativar as notificações.
        </p>
      </div>

      <div className="flex mt-5 items-center gap-3">
        <Icon
          icon="ic:outline-person"
          className="w-[26px] h-[26px] text-[#BDBDBD]"
        />
        <h3 className="text-[18px] text-[#707070] font-bold">Para clientes</h3>
      </div>

      <div className="mt-8 flex flex-col gap-2.5">
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

      <div className="flex mt-5 items-center gap-3">
        <Icon
          icon="ic:outline-admin-panel-settings"
          className="w-[26px] h-[26px] text-[#BDBDBD]"
        />
        <h3 className="text-[18px] text-[#707070] font-bold">
          Para administradores
        </h3>
      </div>

      <hr className="w-full my-[11px] max-md:my-2 h-px border-t-0 bg-gray-200" />

      <div className="mt-8 flex flex-col gap-2.5">
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

      <div className="flex items-center justify-between mt-8 mb-7">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-[251px] max-lg:w-full cursor-pointer"
            onClick={() => prevStep()}
            iconLeft={
              <Icon icon="mdi:arrow-left" className="w-6 h-6 text-[#707070]" />
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
          Mostrar dashboard
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

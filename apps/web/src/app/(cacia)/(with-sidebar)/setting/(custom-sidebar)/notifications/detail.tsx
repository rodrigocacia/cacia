"use client"

import { useEffect, useState } from "react"

import clsx from "clsx"
import { Check } from "lucide-react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { SettinFormData, settingFormSchema } from "@/schemas/setting"
import { Button } from "@/components/ui/custom-button"
import { LinhaNotificacao } from "./components/linha-notificacao"
import { useConnection } from "@/http/hooks/connection"
import { isConnectionWorking } from "@/utils/connection-status"
import { useSetting } from "@/http/hooks/setting"
import { updateSetting } from "@/http/setting/update-setting"
import { Toast } from "@/components/ui/toast"
import { mensagemDeErro } from "@/utils/error-handlers"

import { Cartao, RodapeDoCartao } from "../../_ui/cartao"

export function AdministratorDetail() {
  const [hasSuccess, setHasSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const { mutate, settings } = useSetting(1)
  const { connection } = useConnection()
  const whatsappConectado = isConnectionWorking(connection)

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
        setErrorMessage(mensagemDeErro(result.error))

        return
      }

      setHasSuccess(true)

      mutate()
    } catch {}
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
      <Cartao
        titulo="Notificações via WhatsApp"
        descricao="Escolha quais avisos o assistente envia, e para quem."
        acao={
          <span className="inline-flex h-[22px] items-center gap-1.5 rounded-md border border-[#E3DED6] px-2 text-xs text-tinta-2">
            <span
              aria-hidden
              className={clsx(
                "h-1.5 w-1.5 rounded-full",
                whatsappConectado ? "bg-acao" : "bg-ambar-ponto"
              )}
            />
            {whatsappConectado ? "WhatsApp conectado" : "WhatsApp desconectado"}
          </span>
        }
      >
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <h3 className="rotulo">Para clientes</h3>
            <div className="flex flex-col">
              <LinhaNotificacao
                name="n_w_c_new_event"
                control={control}
                title="Novo evento"
                description="Envie alertas de novos eventos que incluem os clientes"
              />
              <LinhaNotificacao
                name="n_w_c_update_process"
                control={control}
                title="Atualização processual"
                description="Envie alertas de novas atualizações aos processos dos clientes"
              />
            </div>
          </section>

          <section className="flex flex-col gap-4 border-t border-filete pt-7">
            <h3 className="rotulo">Para administradores</h3>
            <div className="flex flex-col">
              <LinhaNotificacao
                name="n_w_a_new_lead"
                control={control}
                title="Novo atendimento de lead"
                description="Receba alertas de novos leads sendo atendidos"
              />
              <LinhaNotificacao
                name="n_w_a_new_mark_lead"
                control={control}
                title="Novo feedback de lead"
                description="Receba alertas de feedbacks coletados em atendimentos de leads"
              />
              <LinhaNotificacao
                name="n_w_a_new_mark_customer"
                control={control}
                title="Novo feedback de cliente"
                description="Receba alertas de feedbacks coletados em atendimentos com clientes"
              />
              <LinhaNotificacao
                name="n_w_a_new_event"
                control={control}
                title="Novo evento"
                description="Receba alertas de novos eventos"
              />
              <LinhaNotificacao
                name="n_w_a_update_process"
                control={control}
                title="Atualização processual"
                description="Receba alertas de novas atualizações aos processos dos clientes"
              />
              <LinhaNotificacao
                name="n_w_a_update_system"
                control={control}
                title="Atualizações do sistema"
                description="Receba alertas sobre melhorias da plataforma"
              />
            </div>
          </section>

          <RodapeDoCartao>
            <Button
              type="submit"
              className="px-5"
              variant="primary"
              iconLeft={<Check size={16} />}
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Salvar
            </Button>
          </RodapeDoCartao>
        </div>
      </Cartao>

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

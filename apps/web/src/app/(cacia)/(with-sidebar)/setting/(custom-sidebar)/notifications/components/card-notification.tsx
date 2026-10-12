import { Control } from "react-hook-form"

import { SettinFormData } from "@/schemas/setting"

import { LinhaNotificacao } from "./linha-notificacao"

interface CardNotificationProps {
  name: keyof SettinFormData
  title: string
  description: string
  control: Control<SettinFormData>
}

/**
 * Preferência de notificação usada no onboarding. Tem a mesma cara da tela de
 * configurações — linha com filete e chave à direita —, então delega para
 * `LinhaNotificacao`. Agrupe as linhas num contêiner com filete (veja a etapa
 * "Notificações" do onboarding).
 */
export function CardNotification(props: CardNotificationProps) {
  return <LinhaNotificacao {...props} />
}

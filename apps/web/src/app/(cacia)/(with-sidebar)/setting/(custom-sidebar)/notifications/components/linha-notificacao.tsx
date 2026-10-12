import { Control, Controller } from "react-hook-form"

import { Switch } from "@/components/ui/switch"
import { SettinFormData } from "@/schemas/setting"

interface LinhaNotificacaoProps {
  name: keyof SettinFormData
  title: string
  description: string
  control: Control<SettinFormData>
}

/**
 * Uma preferência de notificação: título e explicação à esquerda, chave à
 * direita, separadas das vizinhas por filete. (O cartão antigo,
 * `CardNotification`, hoje só delega para cá no onboarding.)
 */
export function LinhaNotificacao({
  name,
  title,
  description,
  control,
}: LinhaNotificacaoProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange } }) => (
        <div className="flex items-center justify-between gap-6 border-t border-[#F1EEE8] py-4 first:border-t-0 first:pt-0 last:pb-0">
          <div className="flex min-w-0 flex-col gap-1">
            <span
              id={`notificacao-${name}`}
              className="text-[14px] font-medium text-tinta"
            >
              {title}
            </span>
            <p className="text-[13px] text-tinta-3">{description}</p>
          </div>

          <Switch
            checked={value}
            onCheckedChange={onChange}
            aria-labelledby={`notificacao-${name}`}
          />
        </div>
      )}
    />
  )
}

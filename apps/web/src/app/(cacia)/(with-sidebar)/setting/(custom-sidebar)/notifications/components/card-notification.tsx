import clsx from "clsx"

import { Icon } from "@/components/icone"
import { Switch } from "@/components/ui/switch"
import { SettinFormData } from "@/schemas/setting"
import { Control, Controller } from "react-hook-form"
import { useConnection } from "@/http/hooks/connection"
import { isConnectionWorking } from "@/utils/connection-status"

interface CardNotificationProps {
  name: keyof SettinFormData
  title: string
  description: string
  control: Control<SettinFormData>
}

export function CardNotification({
  name,
  title,
  description,
  control,
}: CardNotificationProps) {
  const { connection } = useConnection()

  const isWhatsAppConnected = isConnectionWorking(connection)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange } }) => (
        <div
          className={clsx(
            "w-full flex justify-between px-3 py-4 rounded-[12px]",
            {
              "bg-[#ECF7F8]": value,
              "bg-[#FCFCFD]": !value,
            }
          )}
        >
          <div className="flex flex-col gap-2">
            <h4
              className={clsx("text-base text-[#707070]", {
                "font-semibold": value,
                "font-normal": !value,
              })}
            >
              {title}
            </h4>

            <p
              className={clsx("text-sm", {
                "text-[#707070]": value,
                "text-[#BDBDBD]": !value,
              })}
            >
              {description}
            </p>

            <div
              className={clsx(
                "w-fit mt-2 flex items-center gap-1.5 rounded-full px-2.5 py-[7px]",
                {
                  "bg-[#EDFDEE]": isWhatsAppConnected,
                  "bg-[#FFEBEE]": !isWhatsAppConnected,
                }
              )}
            >
              <Icon
                icon="ri:whatsapp-fill"
                className={clsx("w-4 h-4 text-[#16A31B]")}
              />

              <span
                className={clsx("text-xs font-semibold", {
                  "text-[#16A31B]": isWhatsAppConnected,
                  "text-[#F44336]": !isWhatsAppConnected,
                })}
              >
                {isWhatsAppConnected
                  ? "WhatsApp habilitado"
                  : "WhatsApp desconectado"}
              </span>
            </div>
          </div>

          <Switch checked={value} onCheckedChange={onChange} />
        </div>
      )}
    />
  )
}

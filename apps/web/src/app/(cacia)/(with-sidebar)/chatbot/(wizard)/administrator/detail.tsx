"use client"

import { Button } from "@/components/ui/custom-button"
import { Switch } from "@/components/ui/switch"
import { Icon } from "@/components/icone"

export function AdministratorDetail() {
  return (
    <div className="p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm">
      <h3 className="text-[20px] text-[#707070] font-bold max-md:hidden">
        Personalização do assistente
      </h3>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <div className="mt-8 flex flex-col gap-2.5">
        <div className="w-full flex justify-between bg-[#ECF7F8] px-3 py-4 rounded-[12px]">
          <div className="flex flex-col gap-2">
            <h4 className="text-base text-[#707070] font-semibold">
              Novo Atendimento
            </h4>

            <p className="text-sm text-[#707070]">
              Receba alertas de novos atendimentos
            </p>

            <div className="flex items-center gap-1">
              <div className="w-fit mt-2 flex items-center gap-1.5 bg-[#EDFDEE] rounded-full px-2.5 py-[7px]">
                <Icon
                  icon="ri:whatsapp-fill"
                  className="text-[#16A31B] w-4 h-4"
                />

                <span className="text-xs text-[#16A31B] font-semibold">
                  WhatsApp habilitado
                </span>
              </div>

              <div className="w-fit mt-2 flex items-center gap-1.5 bg-[#EDFDEE] rounded-full px-2.5 py-[7px]">
                <Icon
                  icon="ic:baseline-notifications"
                  className="text-[#16A31B] w-4 h-4"
                />

                <span className="text-xs text-[#16A31B] font-semibold">
                  Push habilitado
                </span>
              </div>
            </div>
          </div>

          <Switch />
        </div>

        <div className="w-full flex justify-between bg-[#ECF7F8] px-3 py-4 rounded-[12px]">
          <div className="flex flex-col gap-2">
            <h4 className="text-base text-[#707070] font-semibold">
              Novo Feedback
            </h4>

            <p className="text-sm text-[#707070]">
              Notificações de feedback de clientes
            </p>

            <div className="flex items-center gap-1">
              <div className="w-fit mt-2 flex items-center gap-1.5 bg-[#EDFDEE] rounded-full px-2.5 py-[7px]">
                <Icon
                  icon="ri:whatsapp-fill"
                  className="text-[#16A31B] w-4 h-4"
                />

                <span className="text-xs text-[#16A31B] font-semibold">
                  WhatsApp habilitado
                </span>
              </div>

              <div className="w-fit mt-2 flex items-center gap-1.5 bg-[#EDFDEE] rounded-full px-2.5 py-[7px]">
                <Icon
                  icon="ic:baseline-notifications"
                  className="text-[#16A31B] w-4 h-4"
                />

                <span className="text-xs text-[#16A31B] font-semibold">
                  Push habilitado
                </span>
              </div>
            </div>
          </div>

          <Switch />
        </div>

        <div className="w-full flex justify-between bg-[#ECF7F8] px-3 py-4 rounded-[12px]">
          <div className="flex flex-col gap-2">
            <h4 className="text-base text-[#707070] font-semibold">
              Atualizações do Sistema
            </h4>

            <p className="text-sm text-[#707070]">
              Novidades e melhorias da plataforma
            </p>

            <div className="flex items-center gap-1">
              <div className="w-fit mt-2 flex items-center gap-1.5 bg-[#EDFDEE] rounded-full px-2.5 py-[7px]">
                <Icon
                  icon="ri:whatsapp-fill"
                  className="text-[#16A31B] w-4 h-4"
                />

                <span className="text-xs text-[#16A31B] font-semibold">
                  WhatsApp habilitado
                </span>
              </div>

              <div className="w-fit mt-2 flex items-center gap-1.5 bg-[#EDFDEE] rounded-full px-2.5 py-[7px]">
                <Icon
                  icon="ic:baseline-notifications"
                  className="text-[#16A31B] w-4 h-4"
                />

                <span className="text-xs text-[#16A31B] font-semibold">
                  Push habilitado
                </span>
              </div>
            </div>
          </div>

          <Switch />
        </div>
      </div>

      <div className="w-full flex items-center justify-end max-md:flex-col max-md:gap-4 mt-8 max-md:pb-10">
        <Button
          type="button"
          onClick={() => {}}
          className="px-10 cursor-pointer max-md:w-full"
          variant="primary"
        >
          Salvar
        </Button>
      </div>
    </div>
  )
}

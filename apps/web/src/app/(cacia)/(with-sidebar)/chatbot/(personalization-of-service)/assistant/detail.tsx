"use client"

import { Button } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { Switch } from "@/components/ui/switch"
import { Icon } from "@/components/icone"

export function AssistantDetail() {
  return (
    <div className="p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm">
      <h3 className="text-[20px] max-md:text-[18px] text-[#707070] max-md:text-[#3D3D3D] font-bold">
        Personalização do atendimento
      </h3>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <div className="w-full mt-6 flex flex-col justify-between gap-8">
        <div className="w-full flex justify-between bg-[#ECF7F8] px-3 py-4 rounded-[12px]">
          <div className="flex gap-2">
            <Icon icon="ri:whatsapp-fill" className="text-[#16A31B] w-8 h-8" />

            <div className="flex flex-col gap-2">
              <h4 className="text-base text-[#707070] font-semibold">
                WhatsApp Assistente
              </h4>

              <p className="text-sm text-[#707070]">O assistente está ativo</p>
            </div>
          </div>

          <Switch />
        </div>

        <Input
          label="Nome do Assistente"
          aria-label="Nome"
          iconName="person"
          defaultValue="CacIA"
        />

        <CustomTextarea
          label="Mensagem de Boas-vindas"
          aria-label="Saudação Inicial"
          value="Lorem ipsum dolor sit amet consectetur. Amet sagittis mauris cursus platea tincidunt eu pellentesque."
        />

        <h3 className="text-[20px] text-[#707070] font-bold">
          Configurações Avançadas
        </h3>

        <hr className="w-full h-px border-t-0 bg-gray-200" />

        <div className="flex flex-col gap-6">
          <div className="w-full flex items-center justify-between mt-4">
            <h3 className="text-base text-[#707070]">Respostas Automáticas</h3>

            <Switch />
          </div>

          <hr className="w-full h-px border-t-0 bg-gray-200" />

          <div className="w-full flex items-center justify-between">
            <label className="block text-gray-600 text-base mb-2 font-semibold">
              Aprendizado Contínuo
            </label>

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
    </div>
  )
}

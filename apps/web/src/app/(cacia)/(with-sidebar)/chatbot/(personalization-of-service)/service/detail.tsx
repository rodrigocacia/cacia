"use client"

import { Button } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { CustomRadioButton } from "@/components/ui/custom-radio-button"
import { CustomSelect } from "@/components/ui/custom-select"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { TimeInput } from "@/components/ui/custom-timer"
import { Switch } from "@/components/ui/switch"

const areasDeAtuacao = [
  { value: "tecnologia", label: "Formal" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "financas", label: "Finanças" },
  { value: "marketing", label: "Marketing" },
  { value: "design", label: "Design" },
  { value: "juridico", label: "Jurídico" },
  { value: "rh", label: "Recursos Humanos" },
]

export function ServiceDetail() {
  return (
    <div className="p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm">
      <h3 className="text-[20px] max-md:text-[18px] text-[#707070] max-md:text-[#3D3D3D] font-bold">
        Personalização do atendimento
      </h3>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <div className="w-full mt-6 flex flex-col justify-between gap-8">
        <div className="w-full flex flex-col gap-5">
          <div className="flex flex-col space-x-2">
            <label className="block text-gray-600 text-base mb-2 font-semibold">
              Gênero
            </label>

            <div className="w-full flex gap-4">
              {["Feminino", "Masculino", "Neutro"].map((item) => (
                <CustomRadioButton
                  key={item}
                  label={item}
                  name="name"
                  onChange={() => {}}
                  value=""
                />
              ))}
            </div>
          </div>

          <CustomSelect
            label="Estilo de comunicação"
            options={areasDeAtuacao}
            iconName="work"
          />

          <CustomTextarea
            label="Saudação Inicial"
            aria-label="Saudação Inicial"
            value="Olá, seja bem-vindo à Cacia! Somos uma agência de inteligência artificial especializada em soluções para escritórios de advocacia. Estamos aqui para tornar sua rotina jurídica mais eficiente e inteligente."
          />

          <h3 className="text-[20px] text-[#707070] font-bold">
            Dias de atendimento
          </h3>

          <hr className="w-full h-px border-t-0 bg-gray-200" />

          <div className="w-full flex items-center justify-between mt-4">
            <h3 className="text-base text-[#707070]">Todos os dias</h3>

            <Switch />
          </div>

          <hr className="w-full h-px border-t-0 bg-gray-200" />

          <div className="flex flex-col space-x-2">
            <div className="w-full flex items-center justify-between">
              <label className="block text-gray-600 text-base mb-2 font-semibold">
                Semana
              </label>

              <Switch />
            </div>

            <div className="w-full flex gap-4 mt-4 max-xl:flex-wrap">
              {[
                "Segunda-feira",
                "Terça-feira",
                "Quarta-feira",
                "Quinta-feira",
                "Sexta-feira",
              ].map((item) => (
                <CustomRadioButton
                  key={item}
                  label={item}
                  name="name"
                  onChange={() => {}}
                  value=""
                />
              ))}
            </div>
          </div>

          <hr className="w-full h-px border-t-0 bg-gray-200" />

          <div className="w-full flex items-center justify-between">
            <h3 className="text-base text-[#707070]">Fim de semana</h3>

            <Switch />
          </div>

          <h2 className="text-[18px] text-[#3D3D3D] font-bold">
            Horário de atendimento
          </h2>

          <hr className="w-full h-px border-t-0 bg-gray-200" />

          <div className="flex items-center justify-between gap-[28px] max-xl:flex-col max-xl:gap-2">
            <TimeInput label="Começa" onChange={() => {}} />

            <TimeInput label="Termina" onChange={() => {}} />
          </div>

          <h2 className="text-[18px] text-[#3D3D3D] font-bold">API WhatsApp</h2>

          <hr className="w-full h-px border-t-0 bg-gray-200" />

          <Input
            label="Chave API WhatsApp"
            aria-label="Nome"
            iconName="whatsapp"
          />
        </div>

        <div className="w-full flex items-center justify-end max-md:flex-col max-md:gap-4 mt-8 max-md:pb-10 max-md:mt-8">
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

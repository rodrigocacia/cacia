"use client"

import { Button } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { CustomRadioButton } from "@/components/ui/custom-radio-button"
import { CustomSelect } from "@/components/ui/custom-select"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { TimeInput } from "@/components/ui/custom-timer"
import { Switch } from "@/components/ui/switch"

import { Cartao, RodapeDoCartao } from "../../../setting/_ui/cartao"

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

function Linha({
  titulo,
  children,
}: {
  titulo: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-filete py-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[14px] font-medium text-tinta">{titulo}</span>
        <Switch aria-label={titulo} />
      </div>
      {children}
    </div>
  )
}

export function ServiceDetail() {
  return (
    <>
      <Cartao
        titulo="Personalização do atendimento"
        descricao="Como a assistente se apresenta aos seus clientes."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-medium text-tinta-2">Gênero</span>

            <div className="flex flex-wrap gap-6">
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
            label="Saudação inicial"
            aria-label="Saudação Inicial"
            value="Olá, seja bem-vindo à Cacia! Somos uma agência de inteligência artificial especializada em soluções para escritórios de advocacia. Estamos aqui para tornar sua rotina jurídica mais eficiente e inteligente."
          />
        </div>
      </Cartao>

      <Cartao titulo="Dias de atendimento">
        <div className="flex flex-col">
          <Linha titulo="Todos os dias" />

          <Linha titulo="Semana">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
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
          </Linha>

          <Linha titulo="Fim de semana" />
        </div>
      </Cartao>

      <Cartao titulo="Horário de atendimento">
        <div className="flex items-start gap-6 max-md:flex-col max-md:gap-3">
          <TimeInput label="Começa" onChange={() => {}} />

          <TimeInput label="Termina" onChange={() => {}} />
        </div>
      </Cartao>

      <Cartao titulo="API do WhatsApp">
        <Input
          label="Chave da API do WhatsApp"
          aria-label="Nome"
          iconName="whatsapp"
        />

        <div className="mt-7">
          <RodapeDoCartao>
            <Button
              type="button"
              onClick={() => {}}
              className="cursor-pointer px-8"
              variant="primary"
            >
              Salvar
            </Button>
          </RodapeDoCartao>
        </div>
      </Cartao>
    </>
  )
}

"use client"

import { Button } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { CustomTextarea } from "@/components/ui/custom-textarea"
import { Switch } from "@/components/ui/switch"

import { Cartao, RodapeDoCartao } from "../../../setting/_ui/cartao"

function LinhaComInterruptor({
  titulo,
  descricao,
}: {
  titulo: string
  descricao?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-filete py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[14px] font-medium text-tinta">{titulo}</span>
        {descricao && (
          <span className="text-[13px] text-tinta-3">{descricao}</span>
        )}
      </div>

      <Switch aria-label={titulo} />
    </div>
  )
}

export function AssistantDetail() {
  return (
    <>
      <Cartao
        titulo="Personalização do atendimento"
        descricao="Nome e mensagem com que a assistente abre a conversa."
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4 rounded-[12px] bg-nevoa px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-acao" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-tinta">
                  Assistente no WhatsApp
                </span>
                <span className="text-[13px] text-turquesa-profundo">
                  O assistente está ativo
                </span>
              </div>
            </div>

            <Switch aria-label="Assistente no WhatsApp" />
          </div>

          <Input
            label="Nome do assistente"
            aria-label="Nome"
            iconName="person"
            defaultValue="CacIA"
          />

          <CustomTextarea
            label="Mensagem de boas-vindas"
            aria-label="Saudação Inicial"
            value="Lorem ipsum dolor sit amet consectetur. Amet sagittis mauris cursus platea tincidunt eu pellentesque."
          />
        </div>
      </Cartao>

      <Cartao titulo="Configurações avançadas">
        <div className="flex flex-col">
          <LinhaComInterruptor
            titulo="Respostas automáticas"
            descricao="A assistente responde sem esperar a sua revisão."
          />
          <LinhaComInterruptor
            titulo="Aprendizado contínuo"
            descricao="Usa as conversas para melhorar as próximas respostas."
          />
        </div>

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

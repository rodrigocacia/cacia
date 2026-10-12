"use client"

import { Button } from "@/components/ui/custom-button"

import { Cartao, RodapeDoCartao } from "../../../setting/_ui/cartao"
import { LinhaDeAviso } from "../../_ui/linha-de-aviso"

export function ClientDetail() {
  return (
    <Cartao
      titulo="Avisos para o cliente"
      descricao="O que a assistente envia aos seus clientes."
    >
      <div className="flex flex-col">
        <LinhaDeAviso
          titulo="Novo atendimento"
          descricao="Receba alertas de novos agendamentos"
          canais={["WhatsApp"]}
        />
        <LinhaDeAviso
          titulo="Andamento processual"
          descricao="Atualizações sobre seus processos"
          canais={["WhatsApp"]}
        />
        <LinhaDeAviso
          titulo="Documentos recebidos"
          descricao="Notificações de novos documentos"
          canais={["WhatsApp"]}
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
  )
}

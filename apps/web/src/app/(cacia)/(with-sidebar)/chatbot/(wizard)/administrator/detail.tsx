"use client"

import { Button } from "@/components/ui/custom-button"

import { Cartao, RodapeDoCartao } from "../../../setting/_ui/cartao"
import { LinhaDeAviso } from "../../_ui/linha-de-aviso"

export function AdministratorDetail() {
  return (
    <Cartao
      titulo="Avisos para administradores"
      descricao="O que a assistente envia para a equipe do escritório."
    >
      <div className="flex flex-col">
        <LinhaDeAviso
          titulo="Novo atendimento"
          descricao="Receba alertas de novos atendimentos"
          canais={["WhatsApp", "Push"]}
        />
        <LinhaDeAviso
          titulo="Novo feedback"
          descricao="Notificações de feedback de clientes"
          canais={["WhatsApp", "Push"]}
        />
        <LinhaDeAviso
          titulo="Atualizações do sistema"
          descricao="Novidades e melhorias da plataforma"
          canais={["WhatsApp", "Push"]}
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

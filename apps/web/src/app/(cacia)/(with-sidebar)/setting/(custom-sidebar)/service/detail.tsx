"use client"

import { ServiceTable } from "@/components/tables/service-table"

import { Cartao } from "../../_ui/cartao"
import { Form } from "./new/form"
import { DialogDeleteService } from "./components/dialog-delete-service"

export default function ServiceDetail() {
  // Uma instância só do formulário: com duas (uma por largura de tela), as
  // duas reagiam ao `editId` e abriam dois painéis de edição sobrepostos.
  return (
    <Cartao
      titulo="Serviços oferecidos"
      descricao="O que o escritório atende. O assistente usa esta lista para orientar quem chega."
      acao={<Form />}
    >
      <ServiceTable semMoldura />

      <DialogDeleteService />
    </Cartao>
  )
}

"use client"

import { Suspense } from "react"

import { QuestionsTable } from "@/components/tables/questions-table"
import { CustomSearchFilter } from "@/components/ui/custom-search-filter"

import { Cartao } from "../../_ui/cartao"
import { Form } from "./new/form"
import { DialogDeleteQuestion } from "./components/dialog-delete-question"

export function QuestionDetail() {
  // Uma instância só do formulário: com duas (uma por largura de tela), as
  // duas reagiam ao `editId` e abriam dois painéis de edição sobrepostos.
  return (
    <Cartao
      titulo="Dúvidas frequentes"
      descricao="Perguntas e respostas prontas que o assistente usa no atendimento."
      acao={<Form />}
    >
      <div className="flex flex-col gap-5">
        <Suspense fallback="Carregando...">
          <CustomSearchFilter placeholder="Buscar por nome" />
        </Suspense>

        <QuestionsTable semMoldura />
      </div>

      <DialogDeleteQuestion />
    </Cartao>
  )
}

"use client"

import { useOnboardingStore } from "@/stores/use-onboard-store"

import { HeaderSteps } from "../components/header-steps"
import {
  BotaoAvancar,
  BotaoVoltar,
  RodapeDoPasso,
  SecaoDoPasso,
} from "../components/partes"
import { QuestionsTable } from "@/components/tables/questions-table"
import { Form } from "@/app/(cacia)/(with-sidebar)/setting/(custom-sidebar)/question/new/form"

export function FormQuestion() {
  const { nextStep, prevStep } = useOnboardingStore()

  return (
    <div className="flex w-full flex-col">
      <HeaderSteps />

      <SecaoDoPasso
        titulo="Dúvidas frequentes"
        descricao="Cadastre perguntas que sempre fazem. Eu respondo e você ganha tempo."
        acao={<Form />}
      />

      <div className="flex flex-col gap-5">
        <QuestionsTable />
      </div>

      <RodapeDoPasso>
        <BotaoVoltar onClick={() => prevStep()} />
        <BotaoAvancar type="button" onClick={() => nextStep()} />
      </RodapeDoPasso>
    </div>
  )
}

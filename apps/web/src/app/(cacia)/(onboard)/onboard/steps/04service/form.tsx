"use client"

import { useOnboardingStore } from "@/stores/use-onboard-store"

import { HeaderSteps } from "../components/header-steps"
import {
  BotaoAvancar,
  BotaoVoltar,
  RodapeDoPasso,
  SecaoDoPasso,
} from "../components/partes"
import { Form } from "@/app/(cacia)/(with-sidebar)/setting/(custom-sidebar)/service/new/form"
import { ServiceTable } from "@/components/tables/service-table"
export function FormService() {
  const { nextStep, prevStep } = useOnboardingStore()

  return (
    <div className="flex w-full flex-col">
      <HeaderSteps />

      <SecaoDoPasso
        titulo="Serviços oferecidos"
        descricao="Cadastre os serviços mais comuns."
        acao={<Form />}
      />

      <ServiceTable />

      <RodapeDoPasso>
        <BotaoVoltar onClick={() => prevStep()} />
        <BotaoAvancar type="button" onClick={() => nextStep()} />
      </RodapeDoPasso>
    </div>
  )
}

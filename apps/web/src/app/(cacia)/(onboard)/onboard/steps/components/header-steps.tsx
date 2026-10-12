"use client"

import { useOnboardingStore } from "@/stores/use-onboard-store"

import { PASSOS_DO_ONBOARDING, TOTAL_DE_PASSOS, numeroDoPasso } from "./passos"

interface HeaderStepsProps {
  customTitle?: string
}

/**
 * Abertura do painel de cada etapa: número da etapa em mono, a pergunta em
 * serifa e uma linha de apoio. O progresso fica na lista do painel escuro.
 */
export function HeaderSteps({ customTitle }: HeaderStepsProps) {
  const { step } = useOnboardingStore()

  const atual = step - 1
  const etapa = PASSOS_DO_ONBOARDING[atual]

  return (
    <div className="flex w-full flex-col gap-2.5 pb-7">
      <span className="rotulo">
        Etapa {numeroDoPasso(atual)} de{" "}
        {String(TOTAL_DE_PASSOS).padStart(2, "0")}
      </span>

      <h1 className="font-display text-[38px] leading-[1.08] tracking-[-0.02em] text-tinta max-md:text-[30px]">
        {customTitle || etapa?.titulo}
      </h1>

      {etapa?.descricao && (
        <p className="text-[14.5px] leading-relaxed text-tinta-2">
          {etapa.descricao}
        </p>
      )}
    </div>
  )
}

"use client"

import { ArrowRight } from "lucide-react"

import { useOnboardingStore } from "@/stores/use-onboard-store"

import { Button } from "@/components/ui/custom-button"

import {
  PASSOS_DO_ONBOARDING,
  TOTAL_DE_PASSOS,
  numeroDoPasso,
} from "../components/passos"

export function Form() {
  const { nextStep } = useOnboardingStore()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        nextStep()
      }}
      className="flex w-full flex-grow flex-col justify-center gap-8 py-6"
    >
      <div className="flex flex-col gap-3">
        <span className="rotulo">Bem-vindo</span>

        <h1 className="font-display text-[46px] leading-[1.02] tracking-[-0.03em] text-tinta max-md:text-[34px]">
          Bem-vindo a bordo.
        </h1>

        <p className="max-w-[520px] text-[15px] leading-relaxed text-tinta-2">
          Vou ajudá-lo a me configurar, assim eu já posso começar a falar com
          seus leads e clientes e resolver tarefas para você. Em poucos passos,
          a CacIA fica pronta para atender no WhatsApp, organizar sua agenda e
          acompanhar seus processos.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <span className="rotulo">
          {TOTAL_DE_PASSOS} etapas · cerca de 10 minutos
        </span>

        <ol className="grid grid-cols-2 lg:hidden gap-x-6 rounded-[14px] border border-filete bg-white px-5 py-2 max-sm:grid-cols-1">
          {PASSOS_DO_ONBOARDING.map((p, i) => (
            <li
              key={p.nome}
              className="flex items-center gap-3 border-b border-filete py-2.5 text-[14px] text-tinta [&:nth-last-child(-n+2)]:border-b-0 max-sm:[&:nth-last-child(2)]:border-b"
            >
              <span className="w-6 font-mono text-[11px] text-tinta-3 tabular">
                {numeroDoPasso(i)}
              </span>
              {p.nome}
            </li>
          ))}
        </ol>
      </div>

      <Button
        type="submit"
        className="w-fit min-w-[200px] cursor-pointer max-sm:w-full"
        iconRight={<ArrowRight size={17} strokeWidth={1.7} />}
      >
        Vamos nessa
      </Button>
    </form>
  )
}

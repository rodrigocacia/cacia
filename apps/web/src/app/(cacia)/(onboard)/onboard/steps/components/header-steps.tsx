"use client"

import Image from "next/image"

import { useOnboardingStore } from "@/stores/use-onboard-store"

import { stepsOnboard } from "@/constants/steps"

import { Steps } from "@/components/ui/steps"

interface HeaderStepsProps {
  customTitle?: string
}

export function HeaderSteps({ customTitle }: HeaderStepsProps) {
  const { step } = useOnboardingStore()

  return (
    <div className="w-full flex flex-col gap-10">
      <div className="w-full max-lg:hidden">
        <Image src="/logo-cacia.png" alt="mockup" width={200} height={61} />
      </div>

      <div className="flex flex-col gap-3.5">
        <h3 className="text-2xl text-[#3D3D3D] font-semibold">
          Primeiros passos
        </h3>

        <h3 className="text-lg text-[#BDBDBD] font-semibold">
          {step === 1
            ? "Eu organizo os compromissos. Você define como quer atender."
            : step === 2
              ? "Personalize como vou falar com seus leads e clientes."
              : step === 3
                ? "Personalize minhas notificações e recados para você."
                : "Me abasteça com conhecimento que eu cuido do resto!"}
        </h3>
      </div>

      <Steps
        steps={stepsOnboard}
        currentStep={step - 1}
        customTitle={customTitle}
      />
    </div>
  )
}

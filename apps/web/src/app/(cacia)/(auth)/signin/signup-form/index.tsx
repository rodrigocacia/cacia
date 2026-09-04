"use client"

import { useState } from "react"

import Image from "next/image"

import { FormProvider, useForm } from "react-hook-form"
import { SignupFormData, signupFormSchema } from "@/schemas/signup"
import { zodResolver } from "@hookform/resolvers/zod"

import { AuthTabs } from "@/components/ui/auth-tabs"
import { Heading } from "@/components/ui/heading"
import { Steps } from "@/components/ui/steps"

import { PersonalData } from "./steps/personal-data"
import { ProfessionalData } from "./steps/professional-data"
import { SelectPlan } from "./steps/select-plan"

const stepsAccount = [
  { id: 1, title: "Dados Pessoais", completed: true, current: false },
  { id: 2, title: "Dados jurídicos", completed: false, current: true },
  { id: 3, title: "Plano Beta", completed: false, current: false },
]

export function SignupForm() {
  const [step, setStep] = useState(0)

  const methods = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
  })

  function nextStep() {
    setStep(step + 1)
  }

  function lastStep() {
    setStep(step - 1)
  }

  const steps = [
    <PersonalData key="personal" nextStep={nextStep} />,
    <ProfessionalData
      lastStep={lastStep}
      nextStep={nextStep}
      key="professional"
    />,
    <SelectPlan key="plans" />,
  ]

  return (
    <FormProvider {...methods}>
      <div className="bg-white relative z-10 w-full h-full max-lg:h-fit flex flex-col gap-8 shadow-md rounded-4xl max-lg:rounded-t-4xl  max-lg:rounded-b-none px-8 pt-[28px] max-lg:pb-4">
        <div className="w-full max-lg:hidden">
          <Image src="/logo-cacia.png" alt="mockup" width={200} height={61} />
        </div>

        <AuthTabs />

        <Heading
          title={
            step === 2
              ? "Cadastro concluído! Garanta seu acesso Beta"
              : "Cadastro"
          }
          subtitle={
            step === 1
              ? "Estamos quase lá! Últimos detalhes"
              : step === 2
                ? "Veja o que você recebe no Beta"
                : "Preencha os campos abaixo para iniciar"
          }
        />

        <Steps steps={stepsAccount} currentStep={step} />

        {steps[step]}
      </div>
    </FormProvider>
  )
}

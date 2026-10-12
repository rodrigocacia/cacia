"use client"

import { useState } from "react"

import { FormProvider, useForm } from "react-hook-form"
import { SignupFormData, signupFormSchema } from "@/schemas/signup"
import { zodResolver } from "@hookform/resolvers/zod"

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
      <div className="flex w-full flex-col gap-7">
        <span className="rotulo">
          Criar conta · passo {step + 1} de {steps.length}
        </span>

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

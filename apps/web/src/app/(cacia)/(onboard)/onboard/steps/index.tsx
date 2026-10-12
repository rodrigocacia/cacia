"use client"

import { useOnboardingStore } from "@/stores/use-onboard-store"

import Welcome from "./welcome"
import { Agenda } from "./01agenda"
import { IAAtendimento } from "./02ia-atendimento"
import { IAAssistente } from "./03ia-assistente"
import { Service } from "./04service"
import { Question } from "./05question"
import { WhatsappConnection } from "./06whatsapp-connection"
import { Notification } from "./07notification"
import { GetQrCodeResponse } from "@/http/connection/qr-code"
import { LegalConsultation } from "./03legal-consultation"
import { MolduraDeOnboarding } from "./components/moldura-onboarding"

interface StepsProps {
  qrCode: GetQrCodeResponse | null
}

export function Steps({ qrCode }: StepsProps) {
  const step = useOnboardingStore((state) => state.step)

  const steps = [
    {
      component: <Welcome />,
      key: "welcome",
    },
    {
      component: <Agenda />,
      key: "agenda",
    },
    {
      component: <IAAtendimento />,
      key: "ia-atendimento",
    },
    {
      component: <IAAssistente />,
      key: "ia-assistente",
    },
    {
      component: <LegalConsultation />,
      key: "legal-consultation",
    },
    {
      component: <Service />,
      key: "service",
    },
    {
      component: <Question />,
      key: "question",
    },
    {
      component: <WhatsappConnection qrCode={qrCode} />,
      key: "whatsapp-connection",
    },
    {
      component: <Notification />,
      key: "notification",
    },
  ]

  const atual = steps[step] ?? steps[0]

  return (
    <MolduraDeOnboarding
      passo={steps[step] ? step : 0}
      manchete={
        atual.key === "whatsapp-connection" && qrCode
          ? { inicio: "Escaneie e", destaque: "conecte." }
          : undefined
      }
    >
      {atual.component}
    </MolduraDeOnboarding>
  )
}

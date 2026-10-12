"use client"

import { useOnboardingStore } from "@/stores/use-onboard-store"

import { HeaderSteps } from "../components/header-steps"
import {
  BotaoAvancar,
  BotaoVoltar,
  RodapeDoPasso,
  SecaoDoPasso,
} from "../components/partes"
import { useConnection } from "@/http/hooks/connection"
import { Spinner } from "@/components/ui/sppiner"
import { FormOficialApi } from "@/app/(cacia)/(with-sidebar)/setting/(custom-sidebar)/whatsapp-connection/forms/form-oficial-api"
import { FormEvolutionApi } from "@/app/(cacia)/(with-sidebar)/setting/(custom-sidebar)/whatsapp-connection/forms/form-evolution-api"
import { FormWaha } from "@/app/(cacia)/(with-sidebar)/setting/(custom-sidebar)/whatsapp-connection/forms/form-waha"
import { GetQrCodeResponse } from "@/http/connection/qr-code"
import { WhatsappWarning } from "@/components/ui/whatsapp-warning"

interface FormProps {
  qrCode: GetQrCodeResponse | null
}

export function Form({ qrCode }: FormProps) {
  const { nextStep, prevStep } = useOnboardingStore()

  const { connection, isLoading } = useConnection()
  const typeConnection =
    connection?.whatsapp_connection?.toUpperCase() || "WAHA"

  if (isLoading) return <Spinner />

  return (
    <form className="flex w-full flex-col">
      <HeaderSteps
        customTitle={
          qrCode ? "Escaneie o QR com o WhatsApp para conectar." : undefined
        }
      />

      <SecaoDoPasso
        titulo="Conecte seu WhatsApp"
        descricao="Use um número exclusivo para a CacIA atender seus clientes."
      />

      <WhatsappWarning />

      {typeConnection === "OFICIAL" && <FormOficialApi />}
      {typeConnection === "EVOLUTION" && <FormEvolutionApi qrCode={qrCode} />}
      {typeConnection === "WAHA" && <FormWaha qrCode={qrCode} />}

      <RodapeDoPasso>
        <BotaoVoltar onClick={() => prevStep()} />
        <BotaoAvancar type="button" onClick={() => nextStep()} />
      </RodapeDoPasso>
    </form>
  )
}

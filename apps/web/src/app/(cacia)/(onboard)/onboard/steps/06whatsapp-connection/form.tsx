"use client"

import { useOnboardingStore } from "@/stores/use-onboard-store"

import { Button } from "@/components/ui/custom-button"

import { HeaderSteps } from "../components/header-steps"
import { useConnection } from "@/http/hooks/connection"
import { Spinner } from "@/components/ui/sppiner"
import { Icon } from "@iconify/react/dist/iconify.js"
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
    connection?.whatsapp_connection?.toUpperCase() || "EVOLUTION"

  if (isLoading) return <Spinner />

  return (
    <form className="bg-white relative z-10 w-full h-full max-lg:h-fit flex flex-col shadow-md rounded-4xl px-8 pt-[28px] max-lg:pb-4">
      <HeaderSteps
        customTitle={
          qrCode ? "Escaneie o QR com o WhatsApp para conectar." : undefined
        }
      />

      <div className="w-full flex flex-col gap-3 max-md:mt-4 mt-10">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:plug" className="w-8 h-8 text-[#BDBDBD]" />
          <h3 className="text-[20px] text-[#348C98] font-bold">
            Conecte seu WhatsApp
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-normal text-[#3D3D3D]">
            Use um número exclusivo para a CacIA atender seus clientes.
          </p>
        </div>
      </div>
      <WhatsappWarning className="mt-6" />

      {typeConnection === "OFICIAL" && <FormOficialApi />}
      {typeConnection === "EVOLUTION" && <FormEvolutionApi qrCode={qrCode} />}
      {typeConnection === "WAHA" && <FormWaha qrCode={qrCode} />}

      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-[251px] max-lg:w-full cursor-pointer"
            onClick={() => prevStep()}
            iconLeft={
              <Icon icon="mdi:arrow-left" className="w-6 h-6 text-[#707070]" />
            }
          >
            Voltar
          </Button>
        </div>

        <Button
          type="button"
          className="w-[251px] max-lg:w-fit cursor-pointer"
          variant="primary"
          onClick={() => {
            nextStep()
          }}
          iconRight={
            <Icon icon="mdi:arrow-right" className="w-6 h-6 text-white" />
          }
        >
          Prosseguir
        </Button>
      </div>
    </form>
  )
}

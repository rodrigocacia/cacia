"use client"

import { Icon } from "@/components/icone"
import { FormOficialApi } from "./forms/form-oficial-api"
import { FormEvolutionApi } from "./forms/form-evolution-api"
import { FormWaha } from "./forms/form-waha"
import { GetQrCodeResponse } from "@/http/connection/qr-code"
import { useConnection } from "@/http/hooks/connection"
import { Spinner } from "@/components/ui/sppiner"
import { WhatsappWarning } from "@/components/ui/whatsapp-warning"

interface DetailProps {
  qrCode: GetQrCodeResponse | null
}

export function Detail({ qrCode }: DetailProps) {
  const { connection, isLoading } = useConnection()
  const typeConnection =
    connection?.whatsapp_connection?.toUpperCase() || "WAHA"

  if (isLoading) return <Spinner />

  return (
    <div className="h-full p-8 max-md:p-0 pb-6 md:rounded-2xl md:shadow-sm md:pb-0 bg-white">
      <div className="flex items-center gap-3 max-md:mt-4">
        <Icon icon="mdi:plug" className="w-8 h-8 text-[#BDBDBD]" />

        <h3 className="text-[20px] text-[#707070] font-bold">
          Conexão Whatsapp
        </h3>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <p className="text-sm font-normal text-[#3D3D3D]">
          Use um número exclusivo para a CacIA atender seus clientes.
        </p>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <WhatsappWarning className="mb-6" />

      <div></div>

      {typeConnection === "OFICIAL" && <FormOficialApi />}
      {typeConnection === "EVOLUTION" && <FormEvolutionApi qrCode={qrCode} />}
      {typeConnection === "WAHA" && <FormWaha qrCode={qrCode} />}
    </div>
  )
}

"use client"

import { FormOficialApi } from "./forms/form-oficial-api"
import { FormEvolutionApi } from "./forms/form-evolution-api"
import { FormWaha } from "./forms/form-waha"
import { GetQrCodeResponse } from "@/http/connection/qr-code"
import { useConnection } from "@/http/hooks/connection"
import { Spinner } from "@/components/ui/sppiner"
import { WhatsappWarning } from "@/components/ui/whatsapp-warning"

import { Cartao } from "../../_ui/cartao"

interface DetailProps {
  qrCode: GetQrCodeResponse | null
}

export function Detail({ qrCode }: DetailProps) {
  const { connection, isLoading } = useConnection()
  const typeConnection =
    connection?.whatsapp_connection?.toUpperCase() || "WAHA"

  if (isLoading) return <Spinner />

  return (
    <Cartao
      titulo="Conexão WhatsApp"
      descricao="Use um número exclusivo para a CacIA atender seus clientes."
    >
      <WhatsappWarning className="mb-6" />

      {typeConnection === "OFICIAL" && <FormOficialApi />}
      {typeConnection === "EVOLUTION" && <FormEvolutionApi qrCode={qrCode} />}
      {typeConnection === "WAHA" && <FormWaha qrCode={qrCode} />}
    </Cartao>
  )
}

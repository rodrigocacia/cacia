import { SWRConfig } from "swr"
import { CircleAlert } from "lucide-react"

import { getLegalConsultation } from "@/http/legal-consultation/get-legal-consultation"

import { Cartao } from "../../_ui/cartao"
import { LegalConsultationDetail } from "./detail"

function ErrorMessage({ error }: { error: unknown }) {
  const getErrorMessage = (error: unknown): string => {
    if (typeof error === "string") {
      return error
    }

    if (error && typeof error === "object") {
      if ("message" in error && typeof error.message === "string") {
        return error.message
      }

      if ("error" in error && typeof error.error === "string") {
        return error.error
      }

      return "Erro desconhecido"
    }

    return "Erro interno no servidor"
  }

  return (
    <Cartao titulo="Consulta jurídica">
      <div className="flex items-start gap-3 rounded-[10px] bg-[#FBEDEA] px-4 py-3">
        <CircleAlert
          size={17}
          strokeWidth={1.7}
          className="mt-0.5 shrink-0 text-[#A23B2A]"
          aria-hidden
        />
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[13.5px] font-semibold text-[#A23B2A]">
            Erro ao carregar consulta jurídica
          </h3>
          <p className="text-[13px] text-[#A23B2A]">{getErrorMessage(error)}</p>
        </div>
      </div>
    </Cartao>
  )
}

export default async function LegalConsultation() {
  const result = await getLegalConsultation()

  if (!result.success) {
    if (result.error) {
      return <ErrorMessage error={result.error} />
    }
  }

  const legalConsultation = result.data

  return (
    <SWRConfig
      value={{
        fallback: {
          "legal-consultation": legalConsultation,
        },
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false,
        refreshInterval: 0,
      }}
    >
      <LegalConsultationDetail />
    </SWRConfig>
  )
}

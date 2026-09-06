import { SWRConfig } from "swr"

import { Icon } from "@/components/icone"

import { CustomTab } from "@/components/ui/custom-tab"
import { Header } from "@/components/header"

import { LegalConsultationDetail } from "./detail"
import { NavLinks } from "../navs"
import { getLegalConsultation } from "@/http/legal-consultation/get-legal-consultation"

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
    <div className="p-8 max-md:p-0 pb-4 md:rounded-2xl md:shadow-sm">
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <Icon icon="mdi:alert-circle" className="w-6 h-6 text-red-600" />
        <div>
          <h3 className="text-red-800 font-semibold">
            Erro ao carregar consulta jurídica
          </h3>
          <p className="text-red-600 text-sm">{getErrorMessage(error)}</p>
        </div>
      </div>
    </div>
  )
}

export default async function LegalConsultation() {
  const result = await getLegalConsultation()

  if (!result.success) {
    if (result.error) {
      return (
        <div className="w-full h-full">
          <div className="h-full max-md:hidden">
            <ErrorMessage error={result.error} />
          </div>

          <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between md:hidden">
            <div className="relative flex flex-1 flex-col px-4 pt-2 pb-24 bg-[#BBE2E7] bg-cover bg-center h-[380px] w-full lg:hidden -mb-6 z-0">
              <Header title="Configurações" />
            </div>

            <div className="bg-white relative z-10 w-full max-lg:h-fit flex flex-col rounded-t-4xl mt px-4 py-10 max-lg:pb-0">
              <div className="max-h-[260px]">
                <div className="flex flex-col items-center gap-[17px] relative -top-18">
                  <div className="flex w-[86px] h-[86px] items-center justify-center bg-[#ECF7F8] rounded-[30px]">
                    <Icon
                      icon="octicon:law-16"
                      className="w-[46px] h-[46px] text-[#348C98]"
                    />
                  </div>

                  <h2 className="text-[20px] text-[#3D3D3D] font-bold">
                    Consulta Jurídica
                  </h2>
                </div>

                <CustomTab tabs={NavLinks} />

                <ErrorMessage error={result.error} />
              </div>
            </div>
          </main>
        </div>
      )
    }
  }

  const legalConsultation = result.data

  return (
    <div className="w-full h-full">
      <div className="h-full max-md:hidden">
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
      </div>

      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between md:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-2 pb-24 bg-[#BBE2E7] bg-cover bg-center h-[380px] w-full lg:hidden -mb-6 z-0">
          <Header title="Configurações" />
        </div>

        <div className="bg-white relative z-10 w-full max-lg:h-fit flex flex-col rounded-t-4xl mt px-4 py-10 max-lg:pb-0">
          <div className="max-h-[260px]">
            <div className="flex flex-col items-center gap-[17px] relative -top-18">
              <div className="flex w-[86px] h-[86px] items-center justify-center bg-[#ECF7F8] rounded-[30px]">
                <Icon
                  icon="octicon:law-16"
                  className="w-[46px] h-[46px] text-[#348C98]"
                />
              </div>

              <h2 className="text-[20px] text-[#3D3D3D] font-bold">
                Consulta Jurídica
              </h2>
            </div>

            <CustomTab tabs={NavLinks} />

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
          </div>
        </div>
      </main>
    </div>
  )
}

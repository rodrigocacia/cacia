import { SWRConfig } from "swr"

import { getOfficeById } from "@/http/office/get-office-by-id"

import { Form } from "./form"
import { Header } from "@/components/header"
import { CustomTab } from "@/components/ui/custom-tab"
import { Icon } from "@/components/icone"
import { NavLinks } from "../navs"

export default function ProfessionalData() {
  const office = getOfficeById()

  return (
    <div className="h-screen max-md:h-full">
      <div className="max-md:hidden">
        <SWRConfig
          value={{
            fallback: {
              office: office,
            },
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
            refreshInterval: 0,
          }}
        >
          <Form />
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
                  icon="mdi:work"
                  className="w-[46px] h-[46px] text-[#348C98]"
                />
              </div>

              <h2 className="text-[20px] text-[#3D3D3D] font-bold">
                Dados profissionais
              </h2>
            </div>

            <CustomTab tabs={NavLinks} />

            <SWRConfig
              value={{
                fallback: {
                  office: office,
                },
                revalidateOnFocus: false,
                revalidateIfStale: false,
                revalidateOnReconnect: false,
                refreshInterval: 0,
              }}
            >
              <Form />
            </SWRConfig>
          </div>
        </div>
      </main>
    </div>
  )
}

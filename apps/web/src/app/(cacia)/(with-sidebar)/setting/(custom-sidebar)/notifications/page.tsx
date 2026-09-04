import { CustomTab } from "@/components/ui/custom-tab"
import { AdministratorDetail } from "./detail"
import { Header } from "@/components/header"
import { Icon } from "@iconify/react/dist/iconify.js"
import { NavLinks } from "../navs"
import { getSetting } from "@/http/setting/get-setting"
import { SWRConfig } from "swr"

export default async function Administrator() {
  const setting = await getSetting({ page: 1 })

  return (
    <div className="w-full h-full">
      <div className="h-full max-md:hidden">
        <SWRConfig
          value={{
            fallback: {
              setting: setting,
            },
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
            refreshInterval: 0,
          }}
        >
          <AdministratorDetail />
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
                  icon="mdi:message-notification"
                  className="w-[46px] h-[46px] text-[#348C98]"
                />
              </div>

              <h2 className="text-[20px] text-[#3D3D3D] font-bold">
                Notificações
              </h2>
            </div>

            <CustomTab tabs={NavLinks} />

            <SWRConfig
              value={{
                fallback: {
                  setting: setting,
                },
                revalidateOnFocus: false,
                revalidateIfStale: false,
                revalidateOnReconnect: false,
                refreshInterval: 0,
              }}
            >
              <AdministratorDetail />
            </SWRConfig>
          </div>
        </div>
      </main>
    </div>
  )
}

import { CustomTab } from "@/components/ui/custom-tab"
import { AdministratorDetail } from "./detail"
import { Icon } from "@iconify/react/dist/iconify.js"

const tabs = [
  {
    id: 1,
    name: "Cliente",
    path: "/chatbot/client",
  },
  { id: 2, name: "Administrador", path: "/chatbot/administrator" },
]

export default function Administrator() {
  return (
    <div className="w-full h-screen">
      <div className="h-full max-md:hidden">
        <AdministratorDetail />
      </div>

      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0 grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between lg:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-10 max-md:pt-0 pb-10 justify-end gap-3.5 bg-[url('/bg-login.png')] bg-cover bg-center h-[260px] w-full lg:hidden -mb-6 z-0" />

        <div className="bg-white relative z-10 w-full max-lg:h-fit flex flex-col rounded-t-4xl px-4 py-10 max-lg:pb-0">
          <div className="max-h-[560px]">
            <div className="flex flex-col items-center gap-[17px] relative -top-14">
              <div className="flex w-[86px] h-[86px] items-center justify-center bg-[#ECF7F8] rounded-[30px]">
                <Icon
                  icon="mdi:robot"
                  className="w-[46px] h-[46px] text-[#348C98]"
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <h2 className="text-[18px] text-[#3D3D3D] font-semibold">
                  I.A. Atendimento
                </h2>
              </div>
            </div>

            <CustomTab tabs={tabs} />

            <AdministratorDetail />
          </div>
        </div>
      </main>
    </div>
  )
}

import { Icon } from "@/components/icone"

import { getProcessById } from "@/http/process/get-process-by-id"

import { CustomTab } from "@/components/ui/custom-tab"
import { ProcessBadge } from "@/components/ui/badge/proccess.badge"

import { DocumentDetail } from "./detail"
import { navLinks } from "../navs"
import { formatProcess, formatName } from "@/utils/formatters"

export default async function DocumentInformation({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: processId } = await params

  const process = await getProcessById(processId)

  return (
    <div className="w-full h-full">
      <div className="h-full max-md:hidden">
        <DocumentDetail process={process} documents={process?.documents} />
      </div>

      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between md:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-2 pb-10 bg-[#BBE2E7] bg-cover bg-center h-[160px] w-full lg:hidden -mb-6 z-0"></div>

        <div className="bg-white relative z-10 w-full max-lg:h-fit flex flex-col rounded-t-4xl px-4 py-10 max-lg:pb-0">
          <div className="max-h-[360px]">
            <div className="flex flex-col items-center gap-[17px] relative -top-14">
              <div className="flex w-[86px] h-[86px] items-center justify-center bg-[#ECF7F8] rounded-[30px]">
                <Icon
                  icon="mdi:folder-text"
                  className="w-[46px] h-[46px] text-[#348C98]"
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <h2 className="text-[18px] text-[#3D3D3D] font-semibold">
                    Processo
                  </h2>
                  <h2 className="text-[18px] text-[#3D3D3D] font-semibold">
                    {formatProcess(process?.number)}
                  </h2>
                </div>

                <h3 className="text-sm text-[#707070]">
                  {formatName(process?.customer?.name)}
                </h3>

                <ProcessBadge variant={process?.status} />
              </div>
            </div>

            <CustomTab tabs={navLinks(processId)} />

            <DocumentDetail process={process} documents={process?.documents} />
          </div>
        </div>
      </main>
    </div>
  )
}

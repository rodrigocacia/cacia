import { Icon } from "@/components/icone"

import { getProcessById } from "@/http/process/get-process-by-id"

import { CustomTab } from "@/components/ui/custom-tab"
import { ProcessBadge } from "@/components/ui/badge/proccess.badge"

import { NextEventDetails } from "../../../event/components/next-event-details"
import { Form } from "../../../event/new/form"
import { navLinks } from "../navs"
import { formatProcess, formatName } from "@/utils/formatters"

export default async function ProcessEventsPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ calendar?: string }>
  params: Promise<{ id: string }>
}) {
  const { id: processId } = await params

  const process = await getProcessById(processId)

  return (
    <div className="w-full p-8 max-md:p-0 md:rounded-2xl md:shadow-sm">
      <div className="w-full flex items-center gap-3 max-md:hidden">
        <Icon
          icon="mdi:calendar-month-outline"
          className="text-[#BDBDBD] w-8 h-8"
        />
        <h3 className="text-[20px] text-[#707070] font-bold">Eventos</h3>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <div className="h-full max-md:hidden">
        <div className="w-full flex flex-col mt-8">
          <NextEventDetails
            searchParams={searchParams}
            processId={processId}
            context="process"
          />
        </div>

        <div className="w-full flex flex-row mt-8 justify-between">
          <div />
          <Form processId={processId} customerId={process?.customer?._id} />
        </div>
      </div>

      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0 grid grid-cols-[2fr_3fr] max-lg:flex max-lg:flex-col max-lg:justify-between md:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-2 pb-10 bg-[#BBE2E7] bg-cover bg-center h-[160px] w-full lg:hidden -mb-6 z-0"></div>

        <div className="bg-white relative z-10 w-full max-lg:h-fit flex flex-col rounded-t-4xl px-4 py-10 max-lg:pb-0">
          <div className="w-full max-h-[360px]">
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

            <div className="w-full flex flex-col">
              <NextEventDetails
                searchParams={searchParams}
                processId={processId}
                context="process"
              />
            </div>

            <div className="w-full flex justify-center mt-4">
              <Form processId={processId} customerId={process?.customer?._id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

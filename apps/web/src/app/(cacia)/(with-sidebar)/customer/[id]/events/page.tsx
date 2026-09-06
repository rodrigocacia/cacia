import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { getCustomerById } from "@/http/customer/get-customer-by-id"

import { CustomTab } from "@/components/ui/custom-tab"
import { CustomAvatar } from "@/components/ui/custom-avatar"

import { NextEventDetails } from "../../../event/components/next-event-details"
import { Form } from "../../../event/new/form"
import { Icon } from "@/components/icone"

export default async function CustomerEventsPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ calendar?: string }>
  params: Promise<{ id: string }>
}) {
  const { id: customerId } = await params

  const customer = await getCustomerById(customerId)

  let formattedCreatedAtDate = null

  if (customer?.created_at !== null) {
    formattedCreatedAtDate = format(
      new Date(customer?.created_at),
      "MMMM, yyyy",
      {
        locale: ptBR,
      }
    )
  }

  const tabs = [
    {
      id: 1,
      name: "Informações pessoais",
      path: `/customer/${customerId}/personal-information`,
    },
    { id: 2, name: "Processos", path: `/customer/${customerId}/process` },
    { id: 4, name: "Eventos", path: `/customer/${customerId}/events` },
    { id: 3, name: "Documentos", path: `/customer/${customerId}/document` },
  ]

  return (
    <div className="w-full h-full p-8 max-md:p-0 md:rounded-2xl md:shadow-sm">
      <div className="w-full flex items-center gap-3 max-md:hidden">
        <Icon
          icon="mdi:calendar-month-outline"
          className="text-[#BDBDBD] w-8 h-8"
        />
        <h3 className="text-[20px] text-[#707070] font-bold">Eventos</h3>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <div className="h-full max-md:hidden">
        <div className="w-full flex flex-col">
          <NextEventDetails
            searchParams={searchParams}
            customerId={customerId}
            context="customer"
          />
        </div>

        <div className="w-full flex flex-row mt-8 justify-between">
          <div />
          <Form customerId={customerId} />
        </div>
      </div>

      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0 grid grid-cols-[2fr_3fr] max-lg:flex max-lg:flex-col max-lg:justify-between md:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-2 pb-10 bg-[#ECF7F8] bg-cover bg-center h-[160px] w-full lg:hidden -mb-6 z-0"></div>

        <div className="bg-white relative z-10 w-full max-lg:h-fit flex flex-col rounded-t-4xl px-4 py-10 max-lg:pb-0">
          <div className="w-full max-h-[360px]">
            <div className="flex flex-col items-center gap-[17px] relative -top-14">
              <CustomAvatar
                name={customer?.name ?? ""}
                className="w-[86px] h-[86px] rounded-full object-cover"
              />

              <div className="flex flex-col items-center gap-2">
                <h2 className="text-[18px] text-[#3D3D3D] font-semibold">
                  {customer?.name ?? ""}
                </h2>

                <h3 className="text-sm text-[#707070]">
                  Cliente desde {formattedCreatedAtDate}
                </h3>
              </div>
            </div>

            <CustomTab tabs={tabs} />

            <div className="w-full flex flex-col">
              <NextEventDetails
                searchParams={searchParams}
                customerId={customerId}
                context="customer"
              />
            </div>

            <div className="w-full flex justify-center mt-4">
              <Form customerId={customerId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

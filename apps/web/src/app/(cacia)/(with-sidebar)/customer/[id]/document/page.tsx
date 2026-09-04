import { format } from "date-fns"

import { CustomTab } from "@/components/ui/custom-tab"

import { DocumentDetail } from "./detail"
import { getCustomerById } from "@/http/customer/get-customer-by-id"
import { ptBR } from "date-fns/locale"
import { CustomAvatar } from "@/components/ui/custom-avatar"

export default async function Document({
  params,
}: {
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
    <div className="h-full">
      <div className="h-full max-md:hidden">
        <DocumentDetail customer={customer} documents={customer?.documents} />
      </div>

      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between md:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-2 pb-10 bg-[#ECF7F8] bg-cover bg-center h-[160px] w-full lg:hidden -mb-6 z-0"></div>

        <div className="bg-white relative z-10 w-full max-lg:h-fit flex flex-col rounded-t-4xl px-4 py-10 max-lg:pb-0">
          <div className="max-h-[360px]">
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

            <DocumentDetail
              customer={customer}
              documents={customer?.documents}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

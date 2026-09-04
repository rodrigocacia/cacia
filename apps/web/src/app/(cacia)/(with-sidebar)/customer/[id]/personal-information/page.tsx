import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { getCustomerById } from "@/http/customer/get-customer-by-id"

import { CustomTab } from "@/components/ui/custom-tab"

import { CustomerDetail } from "./detail"
import { tabs } from "../components/tabs"
import { CustomAvatar } from "@/components/ui/custom-avatar"
import { formatName } from "@/utils/formatters"
import { DialogDeleteCustomer } from "../components/dialog-delete-customer"
import { ButtonEditCustomer } from "../components/button-edit-customer"

export default async function ProccessDetail({
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

  return (
    <div className="w-full h-full">
      <div className="h-full max-md:hidden">
        <CustomerDetail
          document={customer?.document}
          email={customer?.email ?? ""}
          address={customer?.address?.[0] ?? null}
          phone={customer?.remotejid ?? ""}
        />
      </div>

      <main className="w-full bg-red-100 h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between md:hidden">
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
                  {formatName(customer?.name ?? "")}
                </h2>

                <h3 className="text-sm text-[#707070]">
                  Cliente desde {formattedCreatedAtDate}
                </h3>
              </div>
            </div>

            <CustomTab tabs={tabs(customerId)} />

            <CustomerDetail
              document={customer?.document}
              email={customer?.email ?? ""}
              address={customer?.address?.[0] ?? null}
              phone={customer?.remotejid ?? ""}
            />

            <div className="flex flex-col gap-3 w-full justify-between mt-2 pb-8">
              <ButtonEditCustomer customerId={customerId} />
              <DialogDeleteCustomer name={formatName(customer?.name ?? "")} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

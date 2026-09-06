import { Icon } from "@/components/icone"
import { formatDocument, formatPhone } from "@/utils/formatters"
import { Address } from "@/types/address"

interface CustomerDetailProps {
  document: string
  email?: string
  address?: Address | null
  phone?: string
}

export function CustomerDetail({
  document,
  email,
  address,
  phone,
}: CustomerDetailProps) {
  return (
    <div className="w-full p-8 max-md:p-0 md:rounded-2xl md:shadow-sm">
      <div className="w-full flex items-center gap-3 max-md:hidden">
        <Icon
          icon="mdi:person-circle-outline"
          className="text-[#BDBDBD] w-8 h-8"
        />

        <h3 className="text-[20px] text-[#707070] font-bold">
          Informações pessoais
        </h3>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <div className="w-full flex flex-col p-3 gap-3 bg-[#FCFCFD] mt-8">
        <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
          <h3 className="text-sm text-[#707070] font-semibold">CPF</h3>

          <p className="text-base text-[#3D3D3D]">{formatDocument(document)}</p>
        </div>

        {email && (
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-semibold">E-mail</h3>

            <p className="text-base text-[#348C98] underline font-semibold">
              {email}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
          <h3 className="text-sm text-[#707070] font-semibold">Telefone</h3>

          <p className="text-base text-[#348C98] underline font-semibold">
            {!!phone ? formatPhone(phone) : "-"}
          </p>
        </div>

        {address && (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm text-[#707070] font-semibold">Endereço</h3>

            <p className="text-base text-[#3D3D3D]">
              {address.street},{" "}
              {address?.complement ? `${address?.complement} -` : ""}{" "}
              {address?.number} - {address?.city}, {address?.state}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

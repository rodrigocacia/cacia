"use client";

import type { Address } from "@/types/address";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatPhone, formatName } from "@/utils/formatters";

interface OfficeDetailProps {
  name: string;
  remotejid: string;
  legal_name: string;
  description: string;
  address: Address[];
}

export function OfficeDetail({
  name,
  remotejid,
  legal_name,
  description,
  address,
}: OfficeDetailProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full p-8 max-md:p-4 md:rounded-2xl md:shadow-sm bg-white">
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon
              icon="mdi:person-circle-outline"
              className="text-[#BDBDBD] w-8 h-8"
            />

            <h3 className="text-[20px] text-[#707070] font-bold">
              Informações
            </h3>
          </div>
        </div>

        <hr className="w-full my-6 max-md:my-4 h-px border-t-0 bg-gray-200" />

        <div className="w-full flex flex-col p-3 gap-3 bg-[#FCFCFD] mt-4 rounded-lg">
          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-semibold">Nome</h3>
            <p className="text-base text-[#3D3D3D]">{formatName(name)}</p>
          </div>

          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-semibold">Telefone</h3>
            <p className="text-base text-[#3D3D3D]">{formatPhone(remotejid)}</p>
          </div>

          <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
            <h3 className="text-sm text-[#707070] font-semibold">Nome legal</h3>
            <p className="text-base text-[#3D3D3D]">{legal_name}</p>
          </div>

          <div className="flex flex-col gap-1.5 pb-3">
            <h3 className="text-sm text-[#707070] font-semibold">Biografia</h3>
            <p className="text-base text-[#3D3D3D]">{description}</p>
          </div>
        </div>
      </div>

      <div className="w-full p-8 max-md:p-4 md:rounded-2xl md:shadow-sm bg-white">
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon
              icon="mdi:map-marker-outline"
              className="text-[#BDBDBD] w-8 h-8"
            />

            <h3 className="text-[20px] text-[#707070] font-bold">Endereços</h3>
          </div>
        </div>

        <hr className="w-full my-6 max-md:my-4 h-px border-t-0 bg-gray-200" />

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {address.map((address, index) => (
            <div
              key={index}
              className="p-4 bg-[#FCFCFD] rounded-lg border border-[#F6F6F9] hover:shadow-sm transition-all duration-200 hover:border-[#E5E5E5]"
            >
              <div className="flex items-start gap-3">
                <Icon
                  icon="mdi:map-marker"
                  className="text-[#BDBDBD] w-5 h-5 mt-1 flex-shrink-0"
                />
                <div className="flex flex-col gap-2 w-full">
                  <h3 className="text-sm text-[#707070] font-semibold">
                    Endereço {index + 1}
                  </h3>
                  <div className="flex flex-col gap-1">
                    <p className="text-base text-[#3D3D3D] font-medium">
                      {address.street}, {address.number}
                    </p>
                    <p className="text-sm text-[#707070]">
                      {address.neighborhood}, {address.city} - {address.state}
                    </p>
                    <p className="text-sm text-[#707070]">{address.cep}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

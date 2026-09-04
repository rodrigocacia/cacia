"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDocument, formatPhone } from "@/utils/formatters";

interface UserDetailProps {
  document: string;
  email: string;
  phone: string;
  userName: string;
}

export function UserDetail({
  document,
  email,
  phone,
  userName,
}: UserDetailProps) {
  return (
    <div className="w-full p-8 max-md:p-0 md:rounded-2xl md:shadow-sm">
      <div className="w-full flex items-center justify-between gap-3 max-md:hidden">
        <div className="flex items-center gap-3">
          <Icon
            icon="mdi:person-circle-outline"
            className="text-[#BDBDBD] w-8 h-8"
          />

          <h3 className="text-[20px] text-[#707070] font-bold">
            Informações do usuário
          </h3>
        </div>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <div className="w-full flex flex-col p-3 gap-3 bg-[#FCFCFD] mt-8">
        <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
          <h3 className="text-sm text-[#707070] font-semibold">Nome</h3>

          <p className="text-base text-[#3D3D3D]">{userName}</p>
        </div>
        <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
          <h3 className="text-sm text-[#707070] font-semibold">CPF /CNPJ</h3>

          <p className="text-base text-[#3D3D3D]">{formatDocument(document)}</p>
        </div>

        <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
          <h3 className="text-sm text-[#707070] font-semibold">E-mail</h3>

          <p className="text-base text-[#348C98] underline font-semibold">
            {email}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 pb-3 border-b border-[#F6F6F9]">
          <h3 className="text-sm text-[#707070] font-semibold">Telefone</h3>

          <p className="text-base text-[#348C98] underline font-semibold">
            {formatPhone(phone)}
          </p>
        </div>
      </div>
    </div>
  );
}

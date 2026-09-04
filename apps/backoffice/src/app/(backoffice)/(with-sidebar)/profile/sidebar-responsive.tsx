import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";

export function SidebarResponsive() {
  return (
    <div className="bg-white relative z-10 w-full max-lg:h-fit flex flex-col shadow-md max-lg:shadow-none rounded-t-4xl px-8 max-lg:pb-0">
      <div>
        <div className="w-full h-[380px] flex flex-col gap-[18px] pt-10">
          <div className="flex items-center gap-2 pb-[18px] border-b border-[#F6F6F9]">
            <Icon
              icon="mdi:person-circle-outline"
              className="text-[#BDBDBD] w-7 h-7"
            />

            <h3 className="text-[18px] text-[#707070] font-bold">Meus dados</h3>
          </div>

          <div className="flex items-center gap-2 pb-[18px] border-b border-[#F6F6F9]">
            <Icon icon="mdi:work-outline" className="text-[#BDBDBD] w-7 h-7" />

            <h3 className="text-[18px] text-[#707070] font-bold">
              Dados profissionais
            </h3>
          </div>

          <Link
            href="/profile/address"
            className="flex items-center gap-2 pb-[18px] border-b border-[#F6F6F9]"
          >
            <Icon
              icon="mdi:address-marker-outline"
              className="text-[#BDBDBD] w-7 h-7"
            />

            <h3 className="text-[18px] text-[#707070] font-bold">Endereço</h3>
          </Link>

          <div className="flex items-center gap-2 pb-[18px] border-b border-[#F6F6F9]">
            <Icon
              icon="mdi:password-outline"
              className="text-[#BDBDBD] w-7 h-7"
            />

            <h3 className="text-[18px] text-[#707070] font-bold">
              Dados de acesso
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

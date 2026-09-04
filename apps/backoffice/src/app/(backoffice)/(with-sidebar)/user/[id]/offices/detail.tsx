import { Icon } from "@iconify/react/dist/iconify.js";

interface OfficeDetailProps {
  name: string;
  address: string;
  city: string;
  state: string;
}

export function OfficeDetail({
  name,
  address,
  city,
  state,
}: OfficeDetailProps) {
  return (
    <div className="w-full p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <Icon icon="mdi:office-building" className="text-[#348C98] w-6 h-6" />
        <h3 className="text-lg text-[#3D3D3D] font-semibold">{name}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Icon
            icon="mdi:map-marker"
            className="text-[#707070] w-5 h-5 mt-0.5"
          />
          <div>
            <p className="text-sm text-[#707070]">Endereço</p>
            <p className="text-base text-[#348C98] font-medium">{address}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Icon icon="mdi:city" className="text-[#707070] w-5 h-5 mt-0.5" />
          <div>
            <p className="text-sm text-[#707070]">Cidade</p>
            <p className="text-base text-[#348C98] font-medium">{city}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Icon icon="mdi:map" className="text-[#707070] w-5 h-5 mt-0.5" />
          <div>
            <p className="text-sm text-[#707070]">Estado</p>
            <p className="text-base text-[#348C98] font-medium">{state}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

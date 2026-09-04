import { CustomAvatar } from "@/components/ui/custom-avatar";
import { Icon } from "@iconify/react";
import Link from "next/link";

interface Subscription {
  plan: string;
  name: string;
  office: string;
  value: string;
  date: string;
}

export function RecentSubscriptions({ data }: { data: Subscription[] }) {
  return (
    <div className="bg-white rounded-2xl w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#3D3D3D] font-semibold text-lg">
          Novas assinaturas
        </h3>
        <Link
          href="/financial"
          className="flex items-center gap-1 px-3 py-1.5 border border-[#E0E6EB] rounded-xl text-[#707070] text-sm font-medium bg-white hover:bg-gray-50 transition"
        >
          Ver todas
          <Icon icon="mdi:arrow-right" className="w-4 h-4 ml-1" />
        </Link>
      </div>
      <ul className="flex flex-col gap-3">
        {data.map((sub, index) => (
          <li
            key={index}
            className="flex items-center justify-between bg-white rounded-xl shadow-sm px-4 py-3 gap-3"
          >
            <CustomAvatar
              name={sub.name || sub.office}
              size="sm"
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
            />
            <div className="flex flex-col flex-1 ml-2">
              <span className="text-[#348C98] font-semibold text-base leading-tight">
                {sub.plan}
              </span>
              <span className="text-[#707070] text-sm font-semibold leading-tight uppercase">
                {sub.office.length > 15
                  ? sub.office.slice(0, 15) + "..."
                  : sub.office}
              </span>
            </div>
            <span className="text-[#707070] font-semibold text-base ml-2 whitespace-nowrap">
              + {sub.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

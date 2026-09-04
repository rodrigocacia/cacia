import { Icon } from "@iconify/react";

interface CardProps {
  label: string;
  value: string;
  icon: string;
}

export function StatisticCard({ label, value, icon }: CardProps) {
  return (
    <div className="bg-white shadow rounded-2xl min-h-[80px] w-full flex flex-row items-center px-6 py-4 gap-4">
      <div className="flex items-center justify-center bg-[#ECF7F8] rounded-full w-12 h-12">
        <Icon icon={icon} className="text-[#348C98] w-7 h-7" />
      </div>
      <div className="flex flex-col justify-center flex-1">
        <span className="text-[#707070] text-2xl font-bold leading-tight mb-1">
          {value}
        </span>
        <span className="text-[#BDBDBD] text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

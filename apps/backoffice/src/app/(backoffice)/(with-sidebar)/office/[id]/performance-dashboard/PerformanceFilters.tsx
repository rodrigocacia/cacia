import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icone";

const periodOptions = [
  { value: "1", label: "Últimas 24 horas" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "15", label: "Últimos 15 dias" },
  { value: "30", label: "Últimos 30 dias" },
];

interface PerformanceFiltersProps {
  onPeriodChange: (period: number) => void;
  selectedPeriod: number;
}

export function PerformanceFilters({
  onPeriodChange,
  selectedPeriod,
}: PerformanceFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-6 w-full pb-4">
      <div className="flex items-center bg-white rounded-full gap-2 px-4 py-2 min-w-[170px]">
        <CustomSelect
          options={periodOptions}
          value={selectedPeriod.toString()}
          variant="compact"
          iconName="calendar"
          onChange={(value) => onPeriodChange(Number(value))}
        />
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-xs text-[#BDBDBD] font-medium flex items-center">
          EXPORTAR COMO:
        </span>
        <Button
          variant="secondary"
          size="icon"
          className="border-[#F6F6F9] bg-[#fff] text-[#348C98] rounded-sm w-10 h-10 flex items-center justify-center cursor-pointer"
        >
          <Icon icon="mdi:table" width={20} height={20} />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="border-[#F6F6F9] bg-[#fff] text-[#348C98] rounded-sm w-10 h-10 flex items-center justify-center cursor-pointer"
        >
          <Icon icon="mdi:file-excel" width={20} height={20} />
        </Button>
      </div>
    </div>
  );
}

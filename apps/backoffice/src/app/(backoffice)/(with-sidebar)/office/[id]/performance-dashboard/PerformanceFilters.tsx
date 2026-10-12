import { FileSpreadsheet, Table2 } from "lucide-react";

import { CustomSelect } from "@/components/ui/custom-select";

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

const BOTAO_DE_EXPORTAR =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-[9px] border border-filete-forte bg-white text-tinta-2 transition-colors hover:bg-gray-100 hover:text-tinta focus-visible:ring-[3px] focus-visible:ring-nevoa-2 focus-visible:outline-none";

export function PerformanceFilters({
  onPeriodChange,
  selectedPeriod,
}: PerformanceFiltersProps) {
  return (
    <div className="flex items-center gap-2 max-sm:w-full">
      <div className="min-w-0 flex-1 sm:w-[193px]">
        <CustomSelect
          options={periodOptions}
          value={selectedPeriod.toString()}
          variant="compact"
          iconName="calendar"
          onChange={(value) => onPeriodChange(Number(value))}
        />
      </div>

      <span aria-hidden className="mx-1 h-5 w-px bg-filete-forte" />

      <button
        type="button"
        aria-label="Exportar como tabela"
        title="Exportar como tabela"
        className={BOTAO_DE_EXPORTAR}
      >
        <Table2 size={16} strokeWidth={1.7} aria-hidden />
      </button>

      <button
        type="button"
        aria-label="Exportar como planilha do Excel"
        title="Exportar como planilha do Excel"
        className={BOTAO_DE_EXPORTAR}
      >
        <FileSpreadsheet size={16} strokeWidth={1.7} aria-hidden />
      </button>
    </div>
  );
}

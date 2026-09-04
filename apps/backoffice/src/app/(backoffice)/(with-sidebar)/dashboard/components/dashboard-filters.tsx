"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CustomSelect } from "@/components/ui/custom-select";
import { RecurrenceStatus } from "@/types/recurrence";

interface DashboardFiltersProps {
  selectedPeriod: string;
  selectedStatus?: string;
}

export function DashboardFilters({
  selectedPeriod,
  selectedStatus,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const periodOptions = [
    { value: "-", label: "Todos os períodos" },
    { value: ".1", label: "Última hora" },
    { value: "1", label: "Últimas 24 horas" },
    { value: "7", label: "Últimos 7 dias" },
    { value: "15", label: "Últimos 15 dias" },
    { value: "30", label: "Últimos 30 dias" },
  ];

  const statusOptions = [
    { value: "-", label: "Todos os status" },
    { value: RecurrenceStatus.PENDING, label: "Pendente" },
    { value: RecurrenceStatus.ACTIVE, label: "Ativo" },
    { value: RecurrenceStatus.CANCELLED, label: "Cancelado" },
  ];

  const handlePeriodChange = (period: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (period === "-") {
      params.set("period", "-");
    }

    if (period) {
      params.set("period", period);
    } else {
      params.delete("period");
    }

    router.push(`?${params.toString()}`);
  };

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (status === "-") {
      params.set("status", "-");
    }

    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between w-full my-4">
      <div className="hidden sm:block" />
      <div className="flex flex-col sm:flex-row items-center bg-white rounded-full gap-2 px-4 py-2 w-full sm:w-auto">
        <div className="w-full sm:w-auto">
          <CustomSelect
            defaultValue={""}
            options={periodOptions}
            value={selectedPeriod}
            variant="compact"
            iconName="calendar"
            onChange={handlePeriodChange}
          />
        </div>
        <div className="w-full sm:w-auto">
          <CustomSelect
            defaultValue={""}
            options={statusOptions}
            value={selectedStatus || "-"}
            variant="compact"
            iconName="lens"
            onChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icone";
import { Eraser, SlidersHorizontal } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/custom-button";
import { CustomSelect } from "@/components/ui/custom-select";
import { OfficeStatus } from "@/types/office";
import {
  SITUACOES_DO_ESCRITORIO,
  situacaoValida,
} from "@/constants/office-status";

interface OfficesFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FilterState {
  status: string;
}

export function OfficesFiltersModal({
  open,
  onOpenChange,
}: OfficesFiltersModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    status: situacaoValida(searchParams.get("status")) ?? "-",
  });

  const statusOptions = [
    { value: "-", label: "Todas as situações" },
    ...Object.values(OfficeStatus).map((situacao) => ({
      value: situacao,
      label: SITUACOES_DO_ESCRITORIO[situacao].rotulo,
    })),
  ];

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "-") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.set("page", "1");
    router.push(`?${params.toString()}`);
    onOpenChange(false);
  };

  const handleClear = () => {
    setFilters({
      status: "-",
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.set("page", "1");

    router.push(`?${params.toString()}`);
    onOpenChange(false);
  };

  const handleQuickFilter = (status: OfficeStatus) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status === status ? "-" : status,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="mb-1 flex flex-row items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-papel-2 text-tinta-2">
            <SlidersHorizontal size={16} strokeWidth={1.7} />
          </div>
          <DialogTitle>Filtros avançados</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-[13.5px] leading-relaxed text-tinta-2">
            Selecione filtros para uma busca mais específica.
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="rotulo mb-2.5">FILTRAGEM RÁPIDA</h4>

              <div className="flex flex-wrap gap-2">
                {Object.values(OfficeStatus).map((situacao) => (
                  <button
                    key={situacao}
                    onClick={() => handleQuickFilter(situacao)}
                    className={`flex h-9 cursor-pointer items-center gap-2 rounded-[9px] border px-3 text-[13.5px] font-medium transition-colors ${
                      filters.status === situacao
                        ? "border-acao bg-nevoa text-turquesa-profundo"
                        : "border-filete-forte bg-white text-tinta-2 hover:bg-gray-100"
                    }`}
                  >
                    <Icon
                      icon={SITUACOES_DO_ESCRITORIO[situacao].icon}
                      className="w-4 h-4"
                    />
                    {SITUACOES_DO_ESCRITORIO[situacao].rotulo}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <CustomSelect
                label="Situação do escritório"
                options={statusOptions}
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
                iconName="lens"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-filete pt-5">
          <Button
            variant="ghost"
            onClick={handleClear}
            iconLeft={<Eraser size={16} strokeWidth={1.7} />}
          >
            Limpar filtros
          </Button>

          <Button variant="primary" onClick={handleSave}>
            Aplicar filtros
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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

interface UsersFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FilterState {
  role: string;
}

export function UsersFiltersModal({
  open,
  onOpenChange,
}: UsersFiltersModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    role: searchParams.get("role")?.toUpperCase() || "-",
  });

  const roleOptions = [
    { value: "", label: "Todos os tipos" },
    { value: "ADMIN", label: "Administrador" },
    { value: "USER", label: "Usuário" },
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
      role: "-",
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("role");
    params.set("page", "1");

    router.push(`?${params.toString()}`);
    onOpenChange(false);
  };

  const getQuickFilterRole = () => {
    if (filters.role === "ADMIN") return "ADMIN";
    if (filters.role === "USER") return "USER";
    return "none";
  };

  const handleQuickFilterRole = (role: string) => {
    const newRole = role === "none" ? "-" : role;
    setFilters((prev) => ({ ...prev, role: newRole }));
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
              <h4 className="rotulo mb-2.5">FILTRAGEM RÁPIDA - TIPO</h4>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickFilterRole("ADMIN")}
                  className={`flex h-9 cursor-pointer items-center gap-2 rounded-[9px] border px-3 text-[13.5px] font-medium transition-colors ${
                    getQuickFilterRole() === "ADMIN"
                      ? "border-acao bg-nevoa text-turquesa-profundo"
                      : "border-filete-forte bg-white text-tinta-2 hover:bg-gray-100"
                  }`}
                >
                  <Icon icon="mdi:shield-crown" className="w-4 h-4" />
                  Admin
                </button>

                <button
                  onClick={() => handleQuickFilterRole("USER")}
                  className={`flex h-9 cursor-pointer items-center gap-2 rounded-[9px] border px-3 text-[13.5px] font-medium transition-colors ${
                    getQuickFilterRole() === "USER"
                      ? "border-acao bg-nevoa text-turquesa-profundo"
                      : "border-filete-forte bg-white text-tinta-2 hover:bg-gray-100"
                  }`}
                >
                  <Icon icon="mdi:account" className="w-4 h-4" />
                  Usuário
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <CustomSelect
                label="Tipo de usuário"
                options={roleOptions}
                value={filters.role}
                onChange={(value) => handleFilterChange("role", value)}
                iconName="person"
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

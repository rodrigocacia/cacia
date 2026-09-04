"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { MdTune, MdCheck, MdDelete } from "react-icons/md";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
    role: searchParams.get("role") || "-",
  });

  const roleOptions = [
    { value: "", label: "Todos os tipos" },
    { value: "admin", label: "Administrador" },
    { value: "user", label: "Usuário" },
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
    if (filters.role === "admin") return "admin";
    if (filters.role === "user") return "user";
    return "none";
  };

  const handleQuickFilterRole = (role: string) => {
    const newRole = role === "none" ? "-" : role;
    setFilters((prev) => ({ ...prev, role: newRole }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="flex flex-row items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-8 h-8 bg-[#ECF7F8] rounded-lg">
            <MdTune size={16} className="text-[#348C98]" />
          </div>
          <DialogTitle className="text-lg font-semibold text-[#3D3D3D]">
            Filtros avançados
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-[#707070] leading-relaxed">
            Selecione filtros para uma busca mais específica.
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-[#707070] uppercase tracking-wider mb-3">
                FILTRAGEM RÁPIDA - TIPO
              </h4>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickFilterRole("admin")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    getQuickFilterRole() === "admin"
                      ? "bg-[#348C98] text-white"
                      : "bg-gray-100 text-[#707070] hover:bg-gray-200"
                  }`}
                >
                  <Icon icon="mdi:shield-crown" className="w-4 h-4" />
                  Admin
                </button>

                <button
                  onClick={() => handleQuickFilterRole("user")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    getQuickFilterRole() === "user"
                      ? "bg-[#348C98] text-white"
                      : "bg-gray-100 text-[#707070] hover:bg-gray-200"
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

        <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <MdDelete size={16} />
            Limpar Filtros
          </Button>

          <Button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#348C98] hover:bg-[#348C98]/90"
          >
            <MdCheck size={16} />
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

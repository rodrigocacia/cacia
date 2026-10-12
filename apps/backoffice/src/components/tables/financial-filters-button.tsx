"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { FinancialFiltersModal } from "./financial-filters-modal";

export function FinancialFiltersButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-filete-forte bg-white px-3.5 text-[13.5px] font-medium text-tinta transition-colors hover:bg-gray-100"
      >
        <SlidersHorizontal
          size={16}
          strokeWidth={1.7}
          className="text-tinta-3"
        />
        Filtros
      </button>

      <FinancialFiltersModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}

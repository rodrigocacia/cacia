"use client";

import { useState } from "react";
import { MdTune } from "react-icons/md";
import { OfficesFiltersModal } from "./offices-filters-modal";

export function OfficesFiltersButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center p-2 gap-2 bg-[#ECF7F8] rounded-2xl max-md:hidden hover:bg-[#ECF7F8]/80 transition-colors cursor-pointer"
      >
        <MdTune size={16} className="text-[#348C98]" />
        <span className="text-xs text-brand font-plus-jakarta font-bold">
          Filtros
        </span>
      </button>

      <OfficesFiltersModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}

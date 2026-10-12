"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  totalItems: number;
  totalPages: number;
  perPage: number;
  currentPage: number;
};

const BOTAO =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-filete-forte bg-white text-tinta-2 transition-colors hover:bg-gray-100 hover:text-tinta disabled:cursor-not-allowed disabled:border-filete disabled:bg-transparent disabled:text-gray-400 disabled:hover:bg-transparent";

export function CustomPagination({
  totalItems,
  totalPages,
  perPage,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const end = Math.min(currentPage * perPage, totalItems);

  const canGoBack = currentPage > 1 && totalPages > 1;
  const canGoForward = currentPage < totalPages;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 text-[13px] text-tinta-3">
      <p>
        Mostrando{" "}
        <strong className="font-semibold text-tinta tabular">{end}</strong> de{" "}
        <strong className="font-semibold text-tinta tabular">
          {totalItems}
        </strong>{" "}
        registros
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={!canGoBack}
          onClick={() => goToPage(currentPage - 1)}
          className={BOTAO}
        >
          <ChevronLeft size={16} strokeWidth={1.7} />
        </button>

        <span className="px-1 font-mono text-xs tabular">
          <span className="text-tinta">{currentPage}</span>
          <span className="text-tinta-3"> / {Math.max(totalPages, 1)}</span>
        </span>

        <button
          type="button"
          aria-label="Próxima página"
          disabled={!canGoForward}
          onClick={() => goToPage(currentPage + 1)}
          className={BOTAO}
        >
          <ChevronRight size={16} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
}

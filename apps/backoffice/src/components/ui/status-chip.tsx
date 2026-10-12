import { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Selo de situação da direção visual 02: contorno discreto e um ponto de
 * 6 px com a cor do estado. Cor de fundo forte competia com o resto da linha.
 */
export function StatusChip({
  ponto,
  children,
  className,
}: {
  /** Classe de fundo do ponto, ex.: `bg-[#4FB3C0]`, `bg-ambar-ponto`. */
  ponto: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-md border border-[#E3DED6] bg-white px-2 text-xs whitespace-nowrap text-tinta-2",
        className,
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", ponto)} />
      {children}
    </span>
  );
}

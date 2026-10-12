"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  /**
   * Mantido por compatibilidade: o anel tem um tamanho só na direção
   * visual 02.
   */
  size?: "sm" | "md" | "lg";
  /**
   * Só o anel, sem a área em volta — para usar dentro de botões e linhas.
   */
  inline?: boolean;
  className?: string;
}

const ANEL =
  "block h-5 w-5 animate-spin rounded-full border-2 border-nevoa-2 border-t-acao";

export function Spinner({ inline = false, className }: SpinnerProps = {}) {
  if (inline) {
    return (
      <span role="status" className={cn("inline-flex", className)}>
        <span aria-hidden className={ANEL} />
        <span className="sr-only">Carregando</span>
      </span>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "flex min-h-40 w-full items-center justify-center py-12",
        className,
      )}
    >
      <span aria-hidden className={ANEL} />
      <span className="sr-only">Carregando</span>
    </div>
  );
}

export function LoadingText() {
  return (
    <div
      role="status"
      className="flex h-20 w-full items-center justify-center gap-2.5"
    >
      <span aria-hidden className={ANEL} />
      <span className="text-[13px] text-tinta-3">Carregando…</span>
    </div>
  );
}

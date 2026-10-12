"use client"

import { cn } from "@/lib/utils"

interface SpinnerProps {
  /**
   * Só o anel, sem a área em volta — para usar dentro de botões e linhas.
   * Sem ele, o anel vem centrado numa faixa discreta, que é o que as telas
   * mostram enquanto carregam (antes era uma caixa de 320 px de altura).
   */
  inline?: boolean
  className?: string
}

export function Spinner({ inline = false, className }: SpinnerProps = {}) {
  const anel = (
    <span
      aria-hidden
      className="block h-5 w-5 animate-spin rounded-full border-2 border-nevoa-2 border-t-acao"
    />
  )

  if (inline) {
    return (
      <span role="status" className={cn("inline-flex", className)}>
        {anel}
        <span className="sr-only">Carregando</span>
      </span>
    )
  }

  return (
    <div
      role="status"
      className={cn(
        "flex min-h-40 w-full items-center justify-center py-12",
        className
      )}
    >
      {anel}
      <span className="sr-only">Carregando</span>
    </div>
  )
}

import { ReactNode } from "react"

/**
 * Linha de busca e filtros das listagens.
 *
 * A busca ocupa o espaço disponível até um limite e os controles à direita
 * ficam agrupados, para que todos compartilhem a mesma altura (h-11) e a
 * mesma linha de base — era isso que faltava quando cada página montava a
 * própria `div` com alturas diferentes.
 */
export function ListToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2.5">{children}</div>
  )
}

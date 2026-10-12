"use client"

import Link from "next/link"
import { ReactNode } from "react"

export type RowAction = {
  label: string
  icon: ReactNode
  href?: string
  onClick?: () => void
  danger?: boolean
}

/**
 * Ações de uma linha de tabela, reveladas quando o ponteiro passa pela linha.
 *
 * Depende de `group/row`, que o `TableRow` aplica.
 *
 * Os botões continuam ocupando espaço mesmo invisíveis, para a coluna não
 * mudar de largura no hover. Duas ressalvas de acesso: `focus-within` mostra
 * o grupo para quem navega por teclado, e onde não existe ponteiro (toque) as
 * ações ficam sempre visíveis — senão não haveria como alcançá-las.
 */
export function RowActions({ actions }: { actions: RowAction[] }) {
  return (
    <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover/row:opacity-100 [@media(hover:none)]:opacity-100">
      {actions.map((action) => {
        const className = `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors [&_svg]:h-4 [&_svg]:w-4 ${
          action.danger
            ? "text-tinta-3 hover:border-[#F3D5CF] hover:bg-[#FBEDEA] hover:text-[#A23B2A]"
            : "text-tinta-3 hover:border-filete-forte hover:bg-white hover:text-tinta"
        }`

        if (action.href) {
          return (
            <Link
              key={action.label}
              href={action.href}
              title={action.label}
              aria-label={action.label}
              className={className}
            >
              {action.icon}
            </Link>
          )
        }

        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            title={action.label}
            aria-label={action.label}
            className={`${className} cursor-pointer`}
          >
            {action.icon}
          </button>
        )
      })}
    </div>
  )
}

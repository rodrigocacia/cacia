import { ReactNode } from "react"

interface PageHeaderProps {
  /** Nome do ícone Iconify (ex.: "mdi:account-group-outline"). */
  icon: ReactNode
  title: string
  /** Total de registros. Omitir quando a página não tem contagem. */
  count?: number
  /** Botão de ação principal, alinhado à direita. */
  action?: ReactNode
}

/**
 * Faixa de título das páginas de listagem: ícone, nome, contagem e ação.
 *
 * Existe para as quatro listagens (leads, clientes, processos, documentos)
 * pararem de repetir a mesma marcação com espaçamentos ligeiramente
 * diferentes em cada arquivo.
 */
export function PageHeader({ icon, title, count, action }: PageHeaderProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-[#ECECF1]">
          {icon}
        </span>

        <h2 className="text-xl font-bold text-[#3D3D3D] max-md:text-lg">
          {title}
        </h2>

        {count !== undefined && (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#EFF1F5] px-2 text-xs font-bold text-[#707070]">
            {count}
          </span>
        )}
      </div>

      {action}
    </div>
  )
}

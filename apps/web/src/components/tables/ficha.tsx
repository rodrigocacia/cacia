import { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Peças das páginas de detalhe (cliente, processo, pasta de documentos), no
 * molde da ficha do lead: cartão de filete com cabeçalho próprio e lista de
 * rótulo/valor separada por filetes.
 */
export function Painel({
  titulo,
  contagem,
  acao,
  children,
  className,
  semPreenchimento = false,
}: {
  titulo: string
  contagem?: number
  acao?: ReactNode
  children: ReactNode
  className?: string
  /** Conteúdo encosta nas bordas do cartão (listas e tabelas). */
  semPreenchimento?: boolean
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-filete bg-white",
        className
      )}
    >
      <div className="flex min-h-[56px] flex-wrap items-center gap-2.5 border-b border-filete px-5 py-3">
        <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-tinta">
          {titulo}
        </h2>
        {contagem !== undefined && (
          <span className="font-mono text-[11px] text-tinta-3 tabular">
            {contagem}
          </span>
        )}
        <span className="flex-grow" />
        {acao}
      </div>

      <div className={semPreenchimento ? "" : "px-5 py-4"}>{children}</div>
    </section>
  )
}

/** Linha da lista de detalhes: rótulo à esquerda, valor à direita. */
export function Detalhe({
  rotulo,
  children,
}: {
  rotulo: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-[44px] items-center gap-4 border-b border-[#F1EEE8] py-2 text-[13.5px] last:border-b-0 max-sm:flex-col max-sm:items-start max-sm:gap-0.5">
      <dt className="w-[150px] shrink-0 text-tinta-3 max-xl:w-[130px]">
        {rotulo}
      </dt>
      <dd className="min-w-0 flex-grow font-medium break-words text-tinta">
        {children}
      </dd>
    </div>
  )
}

/** Título de grupo dentro de um painel. */
export function GrupoDeDetalhes({
  titulo,
  children,
}: {
  titulo: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="rotulo pt-1">{titulo}</h3>
      <dl className="flex flex-col">{children}</dl>
    </div>
  )
}

/** Mensagem de lista vazia dentro de um painel. */
export function Vazio({ children }: { children: ReactNode }) {
  return (
    <p className="px-5 py-10 text-center text-[13.5px] text-tinta-3">
      {children}
    </p>
  )
}

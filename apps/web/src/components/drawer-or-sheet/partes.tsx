import { ReactNode } from "react"

/**
 * Peças comuns dos formulários em painel lateral (lead, cliente, processo,
 * evento, pasta, documento): o mesmo cabeçalho em serifa, o mesmo rótulo de
 * seção e a mesma barra de botões no pé.
 */
export function CabecalhoDoFormulario({
  titulo,
  descricao,
  rotulo,
}: {
  titulo: string
  descricao?: ReactNode
  rotulo?: string
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-filete pt-8 pb-5 max-md:pt-2">
      {rotulo && <span className="rotulo">{rotulo}</span>}
      <h2 className="font-display text-[30px] leading-none text-tinta">
        {titulo}
      </h2>
      {descricao && <p className="text-[13.5px] text-tinta-2">{descricao}</p>}
    </div>
  )
}

/** Título de seção dentro do formulário. */
export function SecaoDoFormulario({ children }: { children: ReactNode }) {
  return <h3 className="rotulo">{children}</h3>
}

/**
 * Barra de botões do pé: secundário à esquerda, principal à direita. Fica
 * presa embaixo do painel enquanto o conteúdo rola.
 */
export function RodapeDoFormulario({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 mt-auto flex items-center justify-end gap-2.5 border-t border-filete bg-papel pt-4 pb-1 max-md:flex-col-reverse max-md:items-stretch [&>button]:max-md:w-full">
      {children}
    </div>
  )
}

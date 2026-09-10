import { ReactNode } from "react"

/**
 * Moldura das listagens: um cartão único em volta da tabela.
 *
 * Antes cada `<tr>` era um cartão com sombra própria, separado dos vizinhos
 * por `border-spacing` — o que dava o efeito de blocos soltos flutuando sobre
 * o fundo. Aqui a sombra e o arredondamento ficam na borda de fora e as
 * linhas se separam por um filete de 1px.
 */
export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white ring-1 ring-[#ECECF1]">
      {children}
    </div>
  )
}

/** Rodapé do cartão, para a paginação. */
export function TableCardFooter({ children }: { children: ReactNode }) {
  return <div className="border-t border-[#F1F1F5] px-4 py-3.5">{children}</div>
}

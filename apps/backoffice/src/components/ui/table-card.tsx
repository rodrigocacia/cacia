import { ReactNode } from "react";

/**
 * Moldura das listagens: um cartão único em volta da tabela.
 *
 * Antes cada `<tr>` era um cartão com sombra própria, separado dos vizinhos
 * por `border-spacing` — o que dava o efeito de blocos soltos flutuando sobre
 * o fundo. Aqui a sombra e o arredondamento ficam na borda de fora e as
 * linhas se separam por um filete de 1px.
 */
export function TableCard({
  children,
  semMoldura,
}: {
  children: ReactNode;
  /**
   * Sem borda nem cantos: para quando a tabela já está dentro de um cartão
   * (telas de configuração) e a moldura viraria cartão dentro de cartão.
   */
  semMoldura?: boolean;
}) {
  return (
    <div
      className={
        semMoldura
          ? "w-full overflow-hidden"
          : "w-full overflow-hidden rounded-[14px] border border-filete bg-white"
      }
    >
      {children}
    </div>
  );
}

/** Rodapé do cartão, para a paginação. */
export function TableCardFooter({ children }: { children: ReactNode }) {
  return <div className="border-t border-filete px-4 py-3">{children}</div>;
}

import { ReactNode } from "react";
import clsx from "clsx";

interface CartaoDeValorProps {
  rotulo: string;
  /** `null` quando não há valor a mostrar: aparece "—" e a `nota` explica. */
  valor: string | null;
  /** Linha de apoio abaixo do valor (variação, valor secundário). */
  detalhe?: ReactNode;
}

/**
 * Indicador do relatório de consumo: uma célula da faixa de números
 * (`FaixaDeIndicadores`), no mesmo desenho do Início do app do escritório.
 */
export function CartaoDeValor({ rotulo, valor, detalhe }: CartaoDeValorProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 bg-white px-6 py-5 max-md:px-4 max-md:py-4">
      <span className="rotulo">{rotulo}</span>

      <span
        className={clsx(
          "tabular truncate text-[30px] leading-none font-medium tracking-[-0.03em] max-md:text-[24px]",
          valor === null ? "text-tinta-3" : "text-tinta",
        )}
      >
        {valor ?? "—"}
      </span>

      {detalhe && (
        <span className="text-[12.5px] leading-snug text-tinta-3">
          {detalhe}
        </span>
      )}
    </div>
  );
}

/**
 * Faixa que junta os indicadores num cartão só, separados por filetes de
 * 1 px (o fundo do cartão aparece no vão entre as células).
 */
export function FaixaDeIndicadores({
  children,
  className,
  rotulo,
}: {
  children: ReactNode;
  /** Colunas da grade, por largura de tela. */
  className?: string;
  rotulo: string;
}) {
  return (
    <section
      aria-label={rotulo}
      className={clsx(
        "grid gap-px overflow-hidden rounded-[14px] border border-filete bg-filete",
        className,
      )}
    >
      {children}
    </section>
  );
}

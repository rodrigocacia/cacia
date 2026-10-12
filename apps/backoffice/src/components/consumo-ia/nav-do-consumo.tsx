"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ABAS = [
  { nome: "Consumo por escritório", path: "/ai-usage" },
  { nome: "Parâmetros de cobrança", path: "/ai-usage/billing" },
];

/**
 * Abas de "Consumo de IA". Não usa o CustomTab: ele marca a aba pelo prefixo
 * do caminho, e "/ai-usage" é prefixo de "/ai-usage/billing" — as duas
 * ficariam ativas ao mesmo tempo.
 */
export function NavDoConsumo() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Seções de Consumo de IA"
      className="flex w-full gap-[22px] overflow-x-auto border-b border-filete text-[13.5px] whitespace-nowrap [scrollbar-width:none]"
    >
      {ABAS.map((aba) => {
        const ativa = pathname === aba.path;

        return (
          <Link
            key={aba.path}
            href={aba.path}
            aria-current={ativa ? "page" : undefined}
            className={clsx(
              "-mb-px shrink-0 border-b-2 pb-2.5 transition-colors",
              ativa
                ? "border-tinta font-semibold text-tinta"
                : "border-transparent text-tinta-3 hover:text-tinta",
            )}
          >
            {aba.nome}
          </Link>
        );
      })}
    </nav>
  );
}

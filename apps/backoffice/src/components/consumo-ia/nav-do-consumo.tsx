"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { Icon } from "@/components/icone";

/**
 * Abas de "Consumo de IA". Não usa o CustomTab: ele marca a aba pelo prefixo
 * do caminho, e "/ai-usage" é prefixo de "/ai-usage/billing" — as duas
 * ficariam ativas ao mesmo tempo.
 */
export function NavDoConsumo() {
  const pathname = usePathname();

  const abas = [
    {
      nome: "Consumo por escritório",
      path: "/ai-usage",
      icon: <Icon icon="mdi:robot-outline" className="w-5 h-5" />,
    },
    {
      nome: "Parâmetros de cobrança",
      path: "/ai-usage/billing",
      icon: <Icon icon="mdi:cog-outline" className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="w-full flex items-center gap-6 border-b border-zinc-200 mt-8 overflow-x-auto whitespace-nowrap">
      {abas.map((aba) => {
        const ativa = pathname === aba.path;

        return (
          <Link
            key={aba.path}
            href={aba.path}
            className={clsx(
              "relative flex items-center gap-1.5 px-1 pb-4 text-sm font-medium hover:text-[#348C98]",
              ativa ? "text-[#348C98]" : "text-zinc-500",
            )}
          >
            <span className={ativa ? "text-[#348C98]" : "text-[#BDBDBD]"}>
              {aba.icon}
            </span>
            {aba.nome}
            {ativa && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-t-full bg-[#348C98]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";

import { useParams, usePathname } from "next/navigation";

import { navLinks } from "./navs";

/**
 * Seções da ficha do usuário, na coluna da esquerda. No celular a coluna
 * some e cada página mostra as mesmas seções em abas sublinhadas.
 */
export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();

  const userId = params.id;

  const isActive = (path: string) => !!pathname.includes(path);

  return (
    <nav aria-label="Seções do usuário" className="max-md:hidden">
      <ul className="sticky top-[76px] flex flex-col gap-1">
        {navLinks(String(userId)).map((link) => {
          const ativo = isActive(link.path);

          return (
            <li key={link.id}>
              <Link
                href={link.path}
                aria-current={ativo ? "page" : undefined}
                className={`flex h-9 items-center gap-2.5 rounded-lg border px-3 text-[13.5px] transition-colors ${
                  ativo
                    ? "border-filete bg-white font-medium text-tinta"
                    : "border-transparent text-tinta-2 hover:bg-gray-100 hover:text-tinta"
                }`}
              >
                <span className={ativo ? "text-tinta" : "text-tinta-3"}>
                  {link.icon}
                </span>
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

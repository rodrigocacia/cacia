"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Bot,
  Building2,
  Landmark,
  LayoutDashboard,
  LogOut,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { sairAction } from "@/auth/sair";

interface ItemDoMenu {
  titulo: string;
  url: string;
  /** Primeiro segmento da rota que acende o item. */
  segmento: string;
  icone: LucideIcon;
}

const ITENS: ItemDoMenu[] = [
  {
    titulo: "Dashboard",
    url: "/dashboard",
    segmento: "dashboard",
    icone: LayoutDashboard,
  },
  { titulo: "Usuários", url: "/user", segmento: "user", icone: Users },
  {
    titulo: "Escritórios",
    url: "/office",
    segmento: "office",
    icone: Building2,
  },
  {
    titulo: "Consumo de IA",
    url: "/ai-usage",
    segmento: "ai-usage",
    icone: Bot,
  },
  {
    titulo: "Financeiro",
    url: "/financial",
    segmento: "financial",
    icone: Landmark,
  },
];

function iniciais(nome?: string): string {
  return (nome ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** O símbolo da marca: o anel com o ponto, sobre o turquesa. */
export function SimboloCacia({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg bg-acao"
      style={{ width: tamanho, height: tamanho }}
    >
      <svg
        width={tamanho * 0.54}
        height={tamanho * 0.54}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <circle cx="8" cy="8" r="5.5" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="8" cy="8" r="2" fill="#FFFFFF" />
      </svg>
    </span>
  );
}

interface AppSidebarProps {
  /** Quem está logado — vem do cookie da sessão, lido no layout. */
  usuario?: { name?: string; email?: string } | null;
}

/**
 * Menu lateral do backoffice: a moldura nanquim da direção visual 02, a
 * mesma do app do escritório. O usuário e o "Sair" ficam no rodapé.
 */
export function AppSidebar({ usuario }: AppSidebarProps) {
  const pathname = usePathname();
  const segmentoAtual = pathname.split("/")[1] || "dashboard";

  return (
    <Sidebar className="border-none">
      <SidebarHeader className="gap-4 px-3 pt-3.5 pb-0">
        <Link
          href="/dashboard"
          className="flex h-11 items-center gap-2.5 rounded-[10px] px-2 transition-colors hover:bg-ink-2"
        >
          <SimboloCacia />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13.5px] font-semibold text-[#F5F2ED]">
              CacIA
            </span>
            <span className="truncate text-[11.5px] text-gray-500">
              Backoffice
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <span className="px-2.5 pb-2 font-mono text-[10.5px] tracking-[0.08em] text-gray-600 uppercase">
          Administração
        </span>
        <nav className="flex flex-col gap-px" aria-label="Menu principal">
          {ITENS.map((item) => {
            const ativo = segmentoAtual === item.segmento;
            const Icone = item.icone;

            return (
              <Link
                key={item.url}
                href={item.url}
                aria-current={ativo ? "page" : undefined}
                className={clsx(
                  "flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors",
                  ativo
                    ? "bg-grafite text-[#F5F2ED]"
                    : "text-gray-400 hover:bg-ink-2 hover:text-[#F5F2ED]",
                )}
              >
                <Icone
                  size={16}
                  strokeWidth={1.7}
                  className={ativo ? "text-turquesa-claro" : undefined}
                />
                <span className="flex-grow">{item.titulo}</span>
              </Link>
            );
          })}
        </nav>
      </SidebarContent>

      <SidebarFooter className="gap-3 px-3 pt-0 pb-3.5">
        <div className="flex items-center gap-2.5 border-t border-ink-line px-1 pt-3">
          <Link
            href="/profile/my-data"
            className={clsx(
              "-mx-1 flex min-w-0 flex-grow items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-ink-2",
              segmentoAtual === "profile" && "bg-grafite",
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2E2A26] text-[11px] font-semibold text-[#E8E3DB]">
              {iniciais(usuario?.name)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] text-[#E8E3DB]">
                {usuario?.name ?? "Minha conta"}
              </span>
              {usuario?.email && (
                <span className="truncate text-[11px] text-gray-500">
                  {usuario.email}
                </span>
              )}
            </span>
          </Link>
          <form action={sairAction}>
            <button
              type="submit"
              aria-label="Sair"
              title="Sair"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-ink-2 hover:text-[#F87171]"
            >
              <LogOut size={16} strokeWidth={1.7} />
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

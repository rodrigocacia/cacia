"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import useSWR from "swr"
import clsx from "clsx"
import {
  CalendarDays,
  CircleHelp,
  FileText,
  House,
  LogOut,
  MessageSquare,
  Scale,
  Settings,
  SquareKanban,
  Users,
  type LucideIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useOfficeById } from "@/http/hooks/office"
import { useMe } from "@/http/hooks/user"
import { getConnection } from "@/http/connection/get-connection"
import { listarConversas } from "@/http/crm/conversas"

interface ItemDoMenu {
  titulo: string
  url: string
  /** Primeiro segmento da rota que acende o item. */
  segmento: string
  icone: LucideIcon
}

const ITENS: ItemDoMenu[] = [
  { titulo: "Início", url: "/dashboard", segmento: "dashboard", icone: House },
  {
    titulo: "Conversas",
    url: "/chat",
    segmento: "chat",
    icone: MessageSquare,
  },
  {
    titulo: "Leads",
    url: "/lead?view=kanban",
    segmento: "lead",
    icone: SquareKanban,
  },
  { titulo: "Clientes", url: "/customer", segmento: "customer", icone: Users },
  { titulo: "Processos", url: "/process", segmento: "process", icone: Scale },
  { titulo: "Agenda", url: "/event", segmento: "event", icone: CalendarDays },
  {
    titulo: "Documentos",
    url: "/document",
    segmento: "document",
    icone: FileText,
  },
]

function iniciais(nome?: string): string {
  return (nome ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
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
  )
}

/**
 * Menu lateral: a moldura nanquim da direção visual 02.
 *
 * Tudo o que aparece aqui é dado real: o escritório, quantas conversas
 * esperam a equipe e se o WhatsApp está conectado. Sem conexão, a
 * assistente não atende, e o cartão diz isso em vez de "ativa".
 */
export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const segmentoAtual = pathname.split("/")[1] || "dashboard"

  const { office } = useOfficeById()
  const { user } = useMe()

  const { data: conexao } = useSWR("menu:conexao", () => getConnection(), {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  })

  const { data: comAEquipe } = useSWR(
    "menu:conversas-com-a-equipe",
    () => listarConversas({ status: "PENDING", limit: 1 }),
    { refreshInterval: 30_000, revalidateOnFocus: false }
  )

  // `status` é o campo da API nova; os outros dois, do formato herdado
  const conectado =
    (conexao as { status?: string } | null)?.status === "CONNECTED" ||
    conexao?.waha_state === "WORKING" ||
    conexao?.evolution_state === "open"
  const aguardando = comAEquipe?.meta.total ?? 0

  async function sair() {
    await fetch("/api/auth/logout", { method: "GET" })
    router.push("/signin")
  }

  return (
    <Sidebar className="border-none">
      <SidebarHeader className="gap-4 px-3 pt-3.5 pb-0">
        <Link
          href="/setting/professional-data"
          className="flex h-11 items-center gap-2.5 rounded-[10px] px-2 transition-colors hover:bg-ink-2"
        >
          <SimboloCacia />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13.5px] font-semibold text-[#F5F2ED]">
              {office?.trade_name || office?.name || "Seu escritório"}
            </span>
            <span className="truncate text-[11.5px] text-gray-500">
              {office?.oab_number ? `OAB ${office.oab_number}` : "CacIA"}
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <nav className="flex flex-col gap-px" aria-label="Menu principal">
          {ITENS.map((item) => {
            const ativo = segmentoAtual === item.segmento
            const Icone = item.icone

            return (
              <Link
                key={item.url}
                href={item.url}
                aria-current={ativo ? "page" : undefined}
                className={clsx(
                  "flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors",
                  ativo
                    ? "bg-grafite text-[#F5F2ED]"
                    : "text-gray-400 hover:bg-ink-2 hover:text-[#F5F2ED]"
                )}
              >
                <Icone
                  size={16}
                  strokeWidth={1.7}
                  className={ativo ? "text-turquesa-claro" : undefined}
                />
                <span className="flex-grow">{item.titulo}</span>
                {item.segmento === "chat" && aguardando > 0 && (
                  <span
                    className="flex h-[18px] items-center rounded-[5px] bg-acao px-1.5 font-mono text-[10.5px] text-white"
                    title="Conversas com a equipe"
                  >
                    {aguardando}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </SidebarContent>

      <SidebarFooter className="gap-3 px-3 pt-0 pb-3.5">
        <Link
          href="/setting/whatsapp-connection"
          className="flex flex-col gap-1.5 rounded-xl border border-ink-line bg-ink-2 p-3 transition-colors hover:border-[#3a3531]"
        >
          <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#F5F2ED]">
            <span
              className={clsx(
                "h-[7px] w-[7px] rounded-full",
                conectado
                  ? "bg-[#4FB3C0] shadow-[0_0_0_3px_rgba(79,179,192,0.2)]"
                  : "bg-ambar-ponto shadow-[0_0_0_3px_rgba(201,138,42,0.2)]"
              )}
            />
            {conectado ? "Assistente ativa" : "Assistente parada"}
          </span>
          <span className="text-xs leading-[1.45] text-gray-500">
            {conectado
              ? "Atendendo pelo WhatsApp do escritório"
              : "Conecte o WhatsApp para ela atender"}
          </span>
        </Link>

        <div className="flex flex-col gap-px">
          <Link
            href="/setting/ia-service"
            className={clsx(
              "flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors",
              segmentoAtual === "setting"
                ? "bg-grafite text-[#F5F2ED]"
                : "text-gray-400 hover:bg-ink-2 hover:text-[#F5F2ED]"
            )}
          >
            <Settings size={16} strokeWidth={1.7} />
            Configurações
          </Link>
          <Link
            href="/support"
            className="flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-gray-400 transition-colors hover:bg-ink-2 hover:text-[#F5F2ED]"
          >
            <CircleHelp size={16} strokeWidth={1.7} />
            Ajuda
          </Link>
        </div>

        <div className="flex items-center gap-2.5 border-t border-ink-line px-1 pt-3">
          <Link
            href="/profile/my-data"
            className="flex min-w-0 flex-grow items-center gap-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2E2A26] text-[11px] font-semibold text-[#E8E3DB]">
              {iniciais(user?.name)}
            </span>
            <span className="truncate text-[13px] text-[#E8E3DB]">
              {user?.name ?? ""}
            </span>
          </Link>
          <button
            type="button"
            onClick={sair}
            aria-label="Sair"
            title="Sair"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-ink-2 hover:text-[#F87171]"
          >
            <LogOut size={16} strokeWidth={1.7} />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

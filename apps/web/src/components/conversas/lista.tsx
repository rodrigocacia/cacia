"use client"

import clsx from "clsx"
import { format, isToday, isYesterday } from "date-fns"

import { Icon } from "@/components/icone"
import { Skeleton } from "@/components/ui/skeleton"
import {
  nomeDoContato,
  type Conversa,
  type Mensagem,
  type StatusDaConversa,
} from "@/http/crm/conversas"

export type Aba = "todas" | StatusDaConversa

export const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "PENDING", rotulo: "Com a equipe" },
  { valor: "ACTIVE", rotulo: "Com a IA" },
  { valor: "COMPLETED", rotulo: "Encerradas" },
]

export function quandoFoi(data: string): string {
  const d = new Date(data)
  if (isToday(d)) return format(d, "HH:mm")
  if (isYesterday(d)) return "ontem"
  return format(d, "dd/MM")
}

const TIPO: Record<string, string> = {
  IMAGE: "Imagem",
  AUDIO: "Áudio",
  VIDEO: "Vídeo",
  DOCUMENT: "Documento",
  LOCATION: "Localização",
  CONTACT: "Contato",
}

export function previa(mensagem: Mensagem | undefined): string {
  if (!mensagem) return "Sem mensagens"

  const texto =
    mensagem.messageText ?? mensagem.messageCaption ?? TIPO[mensagem.type]

  const autor =
    mensagem.sender === "AGENT"
      ? "IA: "
      : mensagem.sender === "USER"
        ? "Você: "
        : ""

  return `${autor}${texto ?? "Mensagem"}`
}

/**
 * Quem falou por último foi o contato: alguém precisa responder.
 *
 * Com a IA ligada, a resposta sai sozinha em segundos; o destaque só importa
 * quando a conversa está com a equipe.
 */
export function esperandoResposta(conversa: Conversa): boolean {
  const ultima = conversa.messages?.[0]
  return (
    conversa.status === "PENDING" &&
    (ultima?.sender === "LEAD" || ultima?.sender === "CUSTOMER")
  )
}

function Iniciais({ nome }: { nome: string }) {
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6F2F4] text-sm font-semibold text-[#2A727C]">
      {iniciais || "?"}
    </span>
  )
}

export function ListaDeConversas({
  conversas,
  carregando,
  selecionada,
  aoSelecionar,
  aba,
  aoTrocarAba,
  busca,
  aoBuscar,
}: {
  conversas: Conversa[]
  carregando: boolean
  selecionada: string | null
  aoSelecionar: (id: string) => void
  aba: Aba
  aoTrocarAba: (aba: Aba) => void
  busca: string
  aoBuscar: (busca: string) => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-[#ECECF1] p-3">
        <label className="flex h-9 items-center gap-2 rounded-lg bg-[#F4F5F7] px-3 text-sm text-zinc-500 focus-within:ring-2 focus-within:ring-[#348C98]/30">
          <Icon icon="mdi:magnify" className="h-4 w-4 shrink-0" />
          <input
            value={busca}
            onChange={(e) => aoBuscar(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="w-full bg-transparent text-zinc-800 outline-none placeholder:text-zinc-400"
          />
        </label>

        <div className="flex gap-0.5 overflow-x-auto [scrollbar-width:none]">
          {ABAS.map((a) => (
            <button
              key={a.valor}
              type="button"
              onClick={() => aoTrocarAba(a.valor)}
              className={clsx(
                "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition",
                aba === a.valor
                  ? "bg-[#24211E] text-white"
                  : "text-zinc-500 hover:bg-[#F4F5F7] hover:text-zinc-800"
              )}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {carregando && conversas.length === 0 ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : conversas.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-zinc-500">
            <Icon icon="mdi:chat-outline" className="h-8 w-8 text-zinc-300" />
            {busca
              ? "Nenhuma conversa encontrada para essa busca."
              : "Nenhuma conversa aqui ainda. Elas aparecem quando alguém manda mensagem para o WhatsApp do escritório."}
          </div>
        ) : (
          <ul>
            {conversas.map((conversa) => {
              const nome = nomeDoContato(conversa)
              const ultima = conversa.messages?.[0]
              const esperando = esperandoResposta(conversa)
              const ativa = conversa.id === selecionada

              return (
                <li key={conversa.id}>
                  <button
                    type="button"
                    onClick={() => aoSelecionar(conversa.id)}
                    className={clsx(
                      "flex w-full items-center gap-3 border-l-[3px] px-3 py-2.5 text-left transition",
                      ativa
                        ? "border-[#348C98] bg-[#F1F8F9]"
                        : "border-transparent hover:bg-[#F8F9FA]"
                    )}
                  >
                    <Iniciais nome={nome} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={clsx(
                            "truncate text-sm text-zinc-900",
                            esperando ? "font-semibold" : "font-medium"
                          )}
                        >
                          {nome}
                        </span>
                        <span
                          className={clsx(
                            "shrink-0 text-[11px]",
                            esperando
                              ? "font-semibold text-[#348C98]"
                              : "text-zinc-400"
                          )}
                        >
                          {quandoFoi(conversa.lastActivityAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={clsx(
                            "truncate text-xs",
                            esperando ? "text-zinc-700" : "text-zinc-500"
                          )}
                        >
                          {previa(ultima)}
                        </span>

                        {esperando ? (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-[#348C98]"
                            title="Aguardando resposta"
                          />
                        ) : conversa.status === "ACTIVE" ? (
                          <Icon
                            icon="mdi:robot-outline"
                            className="h-3.5 w-3.5 shrink-0 text-zinc-400"
                          />
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

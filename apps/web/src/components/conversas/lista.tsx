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
  { valor: "PENDING", rotulo: "Com você" },
  { valor: "ACTIVE", rotulo: "Com a assistente" },
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
      ? "Assistente: "
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
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nevoa text-xs font-semibold text-turquesa-profundo">
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
      <div className="flex flex-col gap-3.5 px-5 pt-[22px] pb-0">
        <h1 className="font-display text-[34px] leading-none text-tinta">
          Conversas
        </h1>

        <label className="flex h-[34px] items-center gap-2 rounded-[9px] border border-[#E3DED6] bg-white px-2.5 text-tinta-3 focus-within:border-acao focus-within:shadow-[0_0_0_3px_#D7EBEE]">
          <Icon icon="mdi:magnify" className="h-4 w-4 shrink-0" />
          <input
            value={busca}
            onChange={(e) => aoBuscar(e.target.value)}
            placeholder="Buscar nome ou telefone"
            aria-label="Buscar conversas"
            className="w-full bg-transparent text-[13px] text-tinta outline-none placeholder:text-gray-400"
          />
        </label>

        <div
          role="tablist"
          className="-mx-5 flex gap-[18px] overflow-x-auto border-b border-filete px-5 text-[13px] [scrollbar-width:none]"
        >
          {ABAS.map((a) => (
            <button
              key={a.valor}
              type="button"
              role="tab"
              aria-selected={aba === a.valor}
              onClick={() => aoTrocarAba(a.valor)}
              className={clsx(
                "-mb-px shrink-0 cursor-pointer border-b-2 pb-2.5 whitespace-nowrap transition-colors",
                aba === a.valor
                  ? "border-tinta font-semibold text-tinta"
                  : "border-transparent text-tinta-3 hover:text-tinta"
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
          <ul className="flex flex-col gap-0.5 p-2">
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
                      "flex w-full cursor-pointer items-center gap-3 rounded-[10px] border p-3 text-left transition-colors",
                      ativa
                        ? "border-filete bg-white"
                        : "border-transparent hover:bg-[#F4F2ED]"
                    )}
                  >
                    <Iniciais nome={nome} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={clsx(
                            "truncate text-[13.5px] text-tinta",
                            esperando ? "font-semibold" : "font-medium"
                          )}
                        >
                          {nome}
                        </span>
                        <span
                          className={clsx(
                            "tabular shrink-0 text-[11.5px]",
                            esperando
                              ? "font-semibold text-ambar"
                              : "text-tinta-3"
                          )}
                        >
                          {quandoFoi(conversa.lastActivityAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={clsx(
                            "truncate text-[12.5px]",
                            esperando ? "text-gray-800" : "text-tinta-3"
                          )}
                        >
                          {previa(ultima)}
                        </span>

                        {esperando ? (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-ambar-ponto"
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

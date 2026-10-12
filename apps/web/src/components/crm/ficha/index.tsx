"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { StageKind } from "@cacia/contracts"

import { ArrowLeft, ArrowUpRight, MessageSquare, Sparkles } from "lucide-react"
import { Spinner } from "@/components/ui/sppiner"
import { Toast } from "@/components/ui/toast"
import { mensagemDoErro } from "@/http/api-crm"
import { listarAgendas, listarMembros } from "@/http/crm/equipe"
import { atualizarLead, definirResponsavel, moverEtapa } from "@/http/crm/leads"
import { useAtividadesDoLead, useFunis, useLead } from "@/http/hooks/crm"
import { formatPhone } from "@/utils/formatters"

import { emReais } from "../quadro/cartao"
import { DialogMotivoDaPerda } from "../quadro/dialog-motivo-da-perda"
import { AgendarAtividade } from "./agendar-atividade"
import { LinhaDoTempo } from "./linha-do-tempo"
import { SeletorDeEtiquetas } from "./seletor-de-etiquetas"

const ROTULO_DA_ORIGEM: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  MANUAL: "Cadastro manual",
  IMPORT: "Planilha importada",
  SITE: "Site",
  INDICACAO: "Indicação",
  OTHER: "Outra",
}

/** Linha da lista de detalhes: rótulo à esquerda, valor à direita. */
function Detalhe({
  rotulo,
  children,
}: {
  rotulo: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[38px] items-center gap-3 border-t border-[#F1EEE8] py-1.5 text-[13px] last:border-b">
      <dt className="w-[104px] shrink-0 text-tinta-3">{rotulo}</dt>
      <dd className="min-w-0 flex-grow font-medium text-tinta">{children}</dd>
    </div>
  )
}

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

function Bloco({
  titulo,
  children,
  acao,
}: {
  titulo: string
  children: React.ReactNode
  acao?: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="rotulo">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  )
}

export function FichaDoLead({ id }: { id: string }) {
  const { lead, isLoading, mutate } = useLead(id)
  const { funis } = useFunis()
  const { atividades, mutate: recarregarAtividades } = useAtividadesDoLead(id)

  const { data: membros } = useSWR("crm:membros", listarMembros, {
    revalidateOnFocus: false,
  })
  const { data: agendas } = useSWR("crm:agendas", listarAgendas, {
    revalidateOnFocus: false,
  })

  const [perda, setPerda] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [editandoValor, setEditandoValor] = useState(false)
  const [valor, setValor] = useState("")

  if (isLoading && !lead) return <Spinner />

  if (!lead) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        Lead não encontrado.
      </p>
    )
  }

  // As etapas do funil DELE, não do padrão: um escritório com dois funis
  // ofereceria as colunas do processo comercial errado.
  const etapas =
    funis.find((funil) => funil.id === lead.pipelineId)?.stages ?? []

  async function mover(stageId: string, motivo?: string): Promise<void> {
    try {
      await moverEtapa(id, stageId, motivo)
      await mutate()
    } catch (falha) {
      setErro(await mensagemDoErro(falha))
    }
  }

  async function trocarResponsavel(ownerId: string): Promise<void> {
    try {
      await definirResponsavel(id, ownerId || null)
      await mutate()
    } catch (falha) {
      setErro(await mensagemDoErro(falha))
    }
  }

  async function salvarValor(): Promise<void> {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."))

    setEditandoValor(false)

    if (!Number.isFinite(numero) || numero < 0) return

    try {
      await atualizarLead(id, { value: numero })
      await mutate()
    } catch (falha) {
      setErro(await mensagemDoErro(falha))
    }
  }

  // A barra de progresso segue as etapas em aberto e a de ganho; perder é uma
  // saída lateral, não o fim da linha, e fica num botão à parte.
  const trilha = etapas.filter((etapa) => etapa.kind !== StageKind.LOST)
  const perdida = etapas.find((etapa) => etapa.kind === StageKind.LOST)
  const posicaoAtual = trilha.findIndex((etapa) => etapa.id === lead.stageId)
  const estaPerdido = perdida?.id === lead.stageId

  return (
    <div className="w-full max-lg:px-4">
      <Link
        href="/lead?view=kanban"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-tinta-3 transition hover:text-tinta"
      >
        <ArrowLeft size={14} />
        Voltar ao funil
      </Link>

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end gap-5 border-b border-filete pb-6">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-nevoa font-display text-[28px] text-turquesa-profundo">
          {iniciais(lead.name)[0] ?? "?"}
        </span>

        <div className="flex min-w-0 flex-grow flex-col gap-1.5">
          <h1 className="truncate font-display text-[44px] leading-none text-tinta max-md:text-[32px]">
            {lead.name}
          </h1>
          <p className="tabular text-[13.5px] text-tinta-2">
            {formatPhone(lead.remotejid)}
            {lead.email && ` · ${lead.email}`}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/chat?leadId=${lead.id}`}
            className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-filete-forte bg-white px-3.5 text-[13.5px] font-medium text-tinta transition hover:bg-gray-100"
          >
            <MessageSquare size={15} strokeWidth={1.7} />
            Abrir conversa
          </Link>

          {lead.customerId && (
            <Link
              href={`/customer/${lead.customerId}`}
              className="inline-flex h-9 items-center gap-2 rounded-[9px] bg-acao px-3.5 text-[13.5px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-acao-escura"
            >
              Ver cliente
              <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </div>

      {/* Etapas: cada segmento é um botão que move o lead */}
      <div className="flex flex-col gap-3 border-b border-filete py-5">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${Math.max(trilha.length, 1)}, minmax(0, 1fr))`,
          }}
        >
          {trilha.map((etapa, indice) => {
            const atual = etapa.id === lead.stageId
            const alcancada = !estaPerdido && indice <= posicaoAtual

            return (
              <button
                key={etapa.id}
                type="button"
                disabled={atual}
                onClick={() => void mover(etapa.id)}
                aria-current={atual ? "step" : undefined}
                className="group flex cursor-pointer flex-col gap-2 text-left disabled:cursor-default"
              >
                <span
                  className={`h-1 rounded-full transition-colors ${
                    alcancada
                      ? "bg-acao"
                      : "bg-[#E3DED6] group-hover:bg-filete-forte"
                  }`}
                />
                <span
                  className={`truncate text-[12.5px] ${
                    atual
                      ? "font-semibold text-tinta"
                      : alcancada
                        ? "text-tinta-2"
                        : "text-tinta-3 group-hover:text-tinta"
                  }`}
                >
                  {etapa.name}
                </span>
              </button>
            )
          })}
        </div>

        {perdida && (
          <div className="flex flex-wrap items-center gap-3">
            {estaPerdido ? (
              <p className="rounded-lg bg-[#FBEDEA] px-3 py-2 text-[13px] text-[#A23B2A]">
                <strong>Perdido</strong>
                {lead.lostReason && ` · ${lead.lostReason}`}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setPerda(perdida.id)}
                className="cursor-pointer text-[12.5px] text-tinta-3 underline-offset-2 hover:text-[#A23B2A] hover:underline"
              >
                Marcar como perdido
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-8">
          {lead.briefing && (
            <div className="grid grid-cols-[4px_minmax(0,1fr)] gap-[18px] rounded-xl border border-filete bg-white px-[22px] py-5">
              <span className="rounded bg-acao" />
              <div className="flex flex-col gap-2.5">
                <span className="flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.08em] text-turquesa-profundo">
                  <Sparkles size={12} strokeWidth={2} />
                  RESUMO DO CASO
                </span>
                <p className="font-display text-[21px] leading-[1.4] whitespace-pre-wrap text-tinta">
                  {lead.briefing}
                </p>
              </div>
            </div>
          )}

          <Bloco titulo="Atividades">
            {atividades.length > 0 && (
              <ul className="flex flex-col">
                {atividades.map((atividade) => (
                  <li
                    key={atividade.id}
                    className="flex items-center justify-between gap-3 border-t border-[#F1EEE8] py-3 last:border-b"
                  >
                    <span className="min-w-0 truncate text-[13.5px] font-medium text-tinta">
                      {atividade.title}
                    </span>

                    <span className="tabular shrink-0 text-xs text-tinta-3">
                      {format(
                        new Date(atividade.startTime),
                        "dd/MM 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <AgendarAtividade
              leadId={id}
              agendas={agendas ?? []}
              aoAgendar={() => recarregarAtividades()}
            />
          </Bloco>

          <Bloco titulo="Histórico no funil">
            <LinhaDoTempo passagens={lead.stageHistory ?? []} />
          </Bloco>
        </div>

        <aside className="flex flex-col gap-7 lg:border-l lg:border-filete lg:pl-7">
          <Bloco titulo="Detalhes">
            <dl className="flex flex-col">
              <Detalhe rotulo="Honorários">
                {editandoValor ? (
                  <input
                    autoFocus
                    value={valor}
                    onChange={(evento) => setValor(evento.target.value)}
                    onBlur={() => void salvarValor()}
                    onKeyDown={(evento) => {
                      if (evento.key === "Enter") void salvarValor()
                      if (evento.key === "Escape") setEditandoValor(false)
                    }}
                    placeholder="0,00"
                    aria-label="Honorários estimados"
                    className="h-8 w-full rounded-md border border-acao px-2 text-[13px] shadow-[0_0_0_3px_#D7EBEE] outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setValor(lead.value ?? "")
                      setEditandoValor(true)
                    }}
                    className="tabular cursor-pointer underline decoration-filete-forte decoration-dotted underline-offset-4 hover:decoration-tinta"
                  >
                    {emReais(lead.value) ?? "definir"}
                  </button>
                )}
              </Detalhe>

              <Detalhe rotulo="Responsável">
                <select
                  value={lead.owner?.id ?? ""}
                  onChange={(evento) =>
                    void trocarResponsavel(evento.target.value)
                  }
                  aria-label="Responsável"
                  className="h-8 w-full cursor-pointer rounded-md border border-transparent bg-transparent px-1 text-[13px] font-medium outline-none hover:border-filete-forte"
                >
                  <option value="">Sem responsável</option>
                  {(membros ?? []).map((membro) => (
                    <option key={membro.id} value={membro.id}>
                      {membro.name}
                    </option>
                  ))}
                </select>
              </Detalhe>

              <Detalhe rotulo="Origem">
                {ROTULO_DA_ORIGEM[lead.source] ?? lead.source}
                {lead.sourceDetail && ` · ${lead.sourceDetail}`}
              </Detalhe>

              <Detalhe rotulo="Criado em">
                <span className="tabular">
                  {format(new Date(lead.createdAt), "dd MMM yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </Detalhe>
            </dl>
          </Bloco>

          <Bloco titulo="Etiquetas">
            <SeletorDeEtiquetas
              leadId={id}
              aplicadas={lead.tags}
              aoMudar={() => mutate()}
            />
          </Bloco>
        </aside>
      </div>

      {perda && (
        <DialogMotivoDaPerda
          onCancelar={() => setPerda(null)}
          onConfirmar={async (motivo) => {
            const stageId = perda
            setPerda(null)
            await mover(stageId, motivo)
          }}
        />
      )}

      {erro && (
        <Toast
          title="Não foi possível salvar"
          description={erro}
          variant="error"
          onClose={() => setErro(null)}
        />
      )}
    </div>
  )
}

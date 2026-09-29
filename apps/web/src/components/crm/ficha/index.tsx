"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { StageKind } from "@cacia/contracts"

import { Icon } from "@/components/icone"
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
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-800">{titulo}</h2>
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

  return (
    <div className="w-full max-lg:px-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/lead?view=kanban"
            className="mb-1 inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-700"
          >
            <Icon icon="mdi:arrow-left" className="h-3.5 w-3.5" />
            Voltar ao funil
          </Link>

          <h1 className="truncate text-xl font-semibold text-zinc-900">
            {lead.name}
          </h1>

          <p className="text-sm text-zinc-500">
            {formatPhone(lead.remotejid)}
            {lead.email && ` · ${lead.email}`}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Link
            href={`/chat?leadId=${lead.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#348C98] px-3 py-1.5 text-sm text-[#2A727C] transition hover:bg-[#F1F8F9]"
          >
            <Icon icon="mdi:forum-outline" className="h-4 w-4" />
            Ver conversa
          </Link>

          {lead.customerId && (
            <Link
              href={`/customer/${lead.customerId}`}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700"
            >
              Já é cliente
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Bloco titulo="Etapa do funil">
            <div className="flex flex-wrap gap-1.5">
              {etapas.map((etapa) => {
                const atual = etapa.id === lead.stageId

                return (
                  <button
                    key={etapa.id}
                    type="button"
                    disabled={atual}
                    onClick={() => {
                      if (etapa.kind === StageKind.LOST) setPerda(etapa.id)
                      else void mover(etapa.id)
                    }}
                    className={`rounded-lg border px-2.5 py-1.5 text-sm transition ${
                      atual
                        ? "border-transparent font-medium text-white"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}
                    style={atual ? { backgroundColor: etapa.color } : undefined}
                  >
                    {etapa.name}
                  </button>
                )
              })}
            </div>

            {lead.lostReason && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <strong>Motivo da perda:</strong> {lead.lostReason}
              </p>
            )}
          </Bloco>

          <Bloco titulo="Atividades">
            {atividades.length > 0 && (
              <ul className="mb-4 space-y-2">
                {atividades.map((atividade) => (
                  <li
                    key={atividade.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-sm text-zinc-800">
                      {atividade.title}
                    </span>

                    <span className="shrink-0 text-xs text-zinc-500">
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

        <div className="space-y-4">
          <Bloco titulo="Etiquetas">
            <SeletorDeEtiquetas
              leadId={id}
              aplicadas={lead.tags}
              aoMudar={() => mutate()}
            />
          </Bloco>

          <Bloco titulo="Negócio">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Valor estimado</dt>
                <dd>
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
                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setValor(lead.value ?? "")
                        setEditandoValor(true)
                      }}
                      className="text-zinc-800 underline decoration-dotted underline-offset-2"
                    >
                      {emReais(lead.value) ?? "definir"}
                    </button>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-zinc-500">Responsável</dt>
                <dd>
                  <select
                    value={lead.owner?.id ?? ""}
                    onChange={(evento) =>
                      void trocarResponsavel(evento.target.value)
                    }
                    className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm outline-none"
                  >
                    <option value="">Sem responsável</option>
                    {(membros ?? []).map((membro) => (
                      <option key={membro.id} value={membro.id}>
                        {membro.name}
                      </option>
                    ))}
                  </select>
                </dd>
              </div>

              <div>
                <dt className="text-xs text-zinc-500">Origem</dt>
                <dd className="text-zinc-800">
                  {ROTULO_DA_ORIGEM[lead.source] ?? lead.source}
                  {lead.sourceDetail && ` · ${lead.sourceDetail}`}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-zinc-500">Criado em</dt>
                <dd className="text-zinc-800">
                  {format(new Date(lead.createdAt), "dd 'de' MMMM',' yyyy", {
                    locale: ptBR,
                  })}
                </dd>
              </div>
            </dl>
          </Bloco>

          {lead.briefing && (
            <Bloco titulo="Observações">
              <p className="whitespace-pre-wrap text-sm text-zinc-700">
                {lead.briefing}
              </p>
            </Bloco>
          )}
        </div>
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

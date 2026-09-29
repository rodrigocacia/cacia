"use client"

import { useState } from "react"

import { mensagemDoErro } from "@/http/api-crm"
import { criarEtiqueta } from "@/http/crm/etiquetas"
import { definirEtiquetas } from "@/http/crm/leads"
import { useEtiquetas } from "@/http/hooks/crm"
import type { Etiqueta } from "@/http/crm/tipos"

import { EtiquetaBadge } from "../etiqueta"

/** Paleta oferecida ao criar. Cores distinguíveis entre si, inclusive lado a lado. */
const CORES = [
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#EC4899",
  "#14B8A6",
  "#6B7280",
]

export function SeletorDeEtiquetas({
  leadId,
  aplicadas,
  aoMudar,
}: {
  leadId: string
  aplicadas: Etiqueta[]
  aoMudar: () => Promise<unknown>
}) {
  const { etiquetas, mutate: recarregarEtiquetas } = useEtiquetas()

  const [aberto, setAberto] = useState(false)
  const [nova, setNova] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const idsAplicados = new Set(aplicadas.map((e) => e.id))

  async function definir(ids: string[]): Promise<void> {
    setSalvando(true)
    setErro(null)

    try {
      // Manda o conjunto COMPLETO: a rota substitui, o que torna a operação
      // idempotente e dispensa saber o que havia antes.
      await definirEtiquetas(leadId, ids)
      await aoMudar()
    } catch (falha) {
      setErro(await mensagemDoErro(falha))
    } finally {
      setSalvando(false)
    }
  }

  async function criarEAplicar(): Promise<void> {
    const nome = nova.trim()

    if (!nome) return

    setSalvando(true)
    setErro(null)

    try {
      const criada = await criarEtiqueta({
        name: nome,
        // Cor rotativa em vez de sempre a mesma: cinco etiquetas cinzas não
        // se distinguem no cartão do quadro.
        color: CORES[etiquetas.length % CORES.length],
      })

      setNova("")
      await recarregarEtiquetas()
      await definir([...idsAplicados, criada.id])
    } catch (falha) {
      setErro(await mensagemDoErro(falha))
      setSalvando(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {aplicadas.map((etiqueta) => (
          <EtiquetaBadge
            key={etiqueta.id}
            etiqueta={etiqueta}
            onRemover={() =>
              void definir([...idsAplicados].filter((id) => id !== etiqueta.id))
            }
          />
        ))}

        <button
          type="button"
          onClick={() => setAberto((atual) => !atual)}
          className="rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-[11px] text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
        >
          {aplicadas.length === 0 ? "adicionar etiqueta" : "+"}
        </button>
      </div>

      {aberto && (
        <div className="mt-2 rounded-lg border border-zinc-200 bg-white p-2">
          <div className="flex flex-wrap gap-1.5">
            {etiquetas
              .filter((etiqueta) => !idsAplicados.has(etiqueta.id))
              .map((etiqueta) => (
                <button
                  key={etiqueta.id}
                  type="button"
                  disabled={salvando}
                  onClick={() => void definir([...idsAplicados, etiqueta.id])}
                  className="opacity-70 transition hover:opacity-100 disabled:opacity-40"
                >
                  <EtiquetaBadge etiqueta={etiqueta} />
                </button>
              ))}

            {etiquetas.length === idsAplicados.size && (
              <span className="text-xs text-zinc-400">
                Todas as etiquetas já estão aplicadas
              </span>
            )}
          </div>

          <div className="mt-2 flex gap-1.5">
            <input
              value={nova}
              onChange={(evento) => setNova(evento.target.value)}
              onKeyDown={(evento) => {
                if (evento.key === "Enter") void criarEAplicar()
              }}
              maxLength={40}
              placeholder="Criar nova etiqueta"
              className="flex-1 rounded-md border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-zinc-400"
            />

            <button
              type="button"
              onClick={() => void criarEAplicar()}
              disabled={salvando || nova.trim().length === 0}
              className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-white transition hover:bg-zinc-800 disabled:opacity-40"
            >
              Criar
            </button>
          </div>

          {erro && <p className="mt-1.5 text-xs text-red-600">{erro}</p>}
        </div>
      )}
    </div>
  )
}

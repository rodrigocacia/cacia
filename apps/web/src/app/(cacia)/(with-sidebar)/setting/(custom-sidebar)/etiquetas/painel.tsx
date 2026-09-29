"use client"

import { useState } from "react"

import { Icon } from "@/components/icone"
import { Spinner } from "@/components/ui/sppiner"
import { Toast } from "@/components/ui/toast"
import { EtiquetaBadge } from "@/components/crm/etiqueta"
import { mensagemDoErro } from "@/http/api-crm"
import {
  atualizarEtiqueta,
  criarEtiqueta,
  removerEtiqueta,
} from "@/http/crm/etiquetas"
import { useEtiquetas } from "@/http/hooks/crm"

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

export function PainelDeEtiquetas() {
  const { etiquetas, isLoading, mutate } = useEtiquetas()

  const [nova, setNova] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [confirmando, setConfirmando] = useState<string | null>(null)

  async function executar(acao: () => Promise<unknown>): Promise<void> {
    setOcupado(true)
    setErro(null)

    try {
      await acao()
      await mutate()
    } catch (falha) {
      setErro(await mensagemDoErro(falha))
    } finally {
      setOcupado(false)
    }
  }

  function adicionar(): void {
    const nome = nova.trim()
    if (!nome) return

    setNova("")
    void executar(() =>
      criarEtiqueta({
        name: nome,
        // Cor rotativa: cinco etiquetas cinzas não se distinguem no cartão
        color: CORES[etiquetas.length % CORES.length],
      })
    )
  }

  if (isLoading && etiquetas.length === 0) return <Spinner />

  return (
    <div className="w-full">
      <h1 className="text-lg font-semibold text-zinc-900">Etiquetas</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Marcam leads e clientes por assunto ou perfil, e servem de filtro no
        funil. Nada aqui entra no contexto da IA — são organização humana.
      </p>

      <div className="mt-5 flex gap-2">
        <input
          value={nova}
          onChange={(evento) => setNova(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") adicionar()
          }}
          maxLength={40}
          placeholder="Nome da nova etiqueta"
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />

        <button
          type="button"
          disabled={ocupado || nova.trim().length === 0}
          onClick={adicionar}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40"
        >
          Criar
        </button>
      </div>

      {etiquetas.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Nenhuma etiqueta cadastrada ainda.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {etiquetas.map((etiqueta) => {
            const usos =
              (etiqueta._count?.leads ?? 0) + (etiqueta._count?.customers ?? 0)

            return (
              <li
                key={etiqueta.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3"
              >
                <EtiquetaBadge etiqueta={etiqueta} />

                <input
                  defaultValue={etiqueta.name}
                  maxLength={40}
                  onBlur={(evento) => {
                    const nome = evento.target.value.trim()
                    if (nome && nome !== etiqueta.name) {
                      void executar(() =>
                        atualizarEtiqueta(etiqueta.id, { name: nome })
                      )
                    }
                  }}
                  className="min-w-32 flex-1 rounded-lg border border-transparent px-2 py-1 text-sm text-zinc-800 outline-none transition hover:border-zinc-200 focus:border-zinc-400"
                />

                <div className="flex items-center gap-1">
                  {CORES.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      aria-label={`Cor ${cor}`}
                      onClick={() =>
                        void executar(() =>
                          atualizarEtiqueta(etiqueta.id, { color: cor })
                        )
                      }
                      style={{ backgroundColor: cor }}
                      className={`h-4 w-4 rounded-full transition ${
                        etiqueta.color.toUpperCase() === cor
                          ? "ring-2 ring-zinc-900 ring-offset-1"
                          : "opacity-50 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>

                <span className="text-xs text-zinc-500">
                  {usos === 0 ? "não usada" : `${usos} uso(s)`}
                </span>

                {confirmando === etiqueta.id ? (
                  <span className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmando(null)
                        void executar(() => removerEtiqueta(etiqueta.id))
                      }}
                      className="font-medium text-red-600"
                    >
                      excluir mesmo
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmando(null)}
                      className="text-zinc-500"
                    >
                      cancelar
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => setConfirmando(etiqueta.id)}
                    aria-label={`Excluir etiqueta ${etiqueta.name}`}
                    className="text-zinc-400 transition hover:text-red-600 disabled:opacity-30"
                  >
                    <Icon icon="mdi:trash-can-outline" className="h-4 w-4" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-4 text-xs text-zinc-500">
        Excluir uma etiqueta a remove de todos os leads e clientes que a tinham.
        Não há como desfazer.
      </p>

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

"use client"

import { useState } from "react"

/**
 * Pergunta por que o negócio não seguiu.
 *
 * A API recusa mover para uma etapa de perda sem motivo, e com razão: um funil
 * que perde sem motivo registrado não ensina nada. Perguntar aqui evita que a
 * recusa chegue como um 400 que a pessoa leria como "o sistema não deixou".
 */
export function DialogMotivoDaPerda({
  onConfirmar,
  onCancelar,
}: {
  onConfirmar: (motivo: string) => Promise<void>
  onCancelar: () => void
}) {
  const [motivo, setMotivo] = useState("")
  const [enviando, setEnviando] = useState(false)

  const vazio = motivo.trim().length === 0

  async function confirmar(): Promise<void> {
    if (vazio || enviando) return

    setEnviando(true)
    await onConfirmar(motivo.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-zinc-900">
          Por que este lead foi perdido?
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          O motivo aparece na ficha e é o que permite entender depois onde o
          funil está vazando.
        </p>

        <textarea
          autoFocus
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Ex.: fechou com outro escritório, sem orçamento, sumiu"
          className="mt-3 w-full resize-none rounded-lg border border-zinc-300 p-2.5 text-sm outline-none focus:border-zinc-500"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={enviando}
            className="rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => void confirmar()}
            disabled={vazio || enviando}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40"
          >
            {enviando ? "Movendo…" : "Marcar como perdido"}
          </button>
        </div>
      </div>
    </div>
  )
}

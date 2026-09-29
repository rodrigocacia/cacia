"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { CartaoDoLead, emReais } from "./cartao"
import type { Coluna } from "@/http/crm/tipos"

/** Marca visual das etapas de fim de linha. */
const ROTULO_DA_NATUREZA: Record<string, string> = {
  WON: "ganho",
  LOST: "perdido",
}

export function ColunaDoQuadro({
  coluna,
  onAbrir,
}: {
  coluna: Coluna
  onAbrir: (id: string) => void
}) {
  // A coluna inteira é a área de soltar, não só a lista: uma coluna vazia
  // precisa aceitar o cartão, e uma lista sem itens não tem altura nenhuma.
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id })

  const valor = emReais(coluna.valorTotal)
  const natureza = ROTULO_DA_NATUREZA[coluna.kind]
  const naoListados = coluna.total - coluna.leads.length

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border transition ${
        isOver ? "border-zinc-400 bg-zinc-100" : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: coluna.color }}
          aria-hidden
        />

        <p className="flex-1 truncate text-sm font-semibold text-zinc-800">
          {coluna.name}
        </p>

        {natureza && (
          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] uppercase text-zinc-600">
            {natureza}
          </span>
        )}

        <span className="rounded bg-white px-1.5 py-0.5 text-xs font-medium text-zinc-600">
          {coluna.total}
        </span>
      </div>

      {valor && (
        <p className="border-b border-zinc-200 px-3 py-1.5 text-xs font-medium text-emerald-700">
          {valor}
        </p>
      )}

      <div className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2">
        <SortableContext
          items={coluna.leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {coluna.leads.map((cartao) => (
            <CartaoDoLead key={cartao.id} cartao={cartao} onAbrir={onAbrir} />
          ))}
        </SortableContext>

        {coluna.leads.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-zinc-400">
            Nenhum lead aqui
          </p>
        )}

        {naoListados > 0 && (
          // O quadro carrega os primeiros de cada coluna, não a etapa inteira:
          // uma etapa com dez mil leads não pode obrigar o navegador a receber
          // os dez mil para desenhar cinco colunas.
          <p className="px-1 py-2 text-center text-[11px] text-zinc-400">
            + {naoListados} não exibidos — use a busca ou a visão em tabela
          </p>
        )}
      </div>
    </div>
  )
}

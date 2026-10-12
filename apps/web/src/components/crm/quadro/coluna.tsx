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
      className={`flex w-[280px] shrink-0 flex-col rounded-xl transition-colors ${
        isOver ? "bg-nevoa" : ""
      }`}
    >
      {/* O filete na cor da etapa substitui a caixa em volta da coluna */}
      <div
        className="flex h-[34px] items-center gap-2 border-b-2 px-1"
        style={{ borderBottomColor: coluna.color }}
      >
        <p className="truncate text-[13px] font-semibold text-tinta">
          {coluna.name}
        </p>

        <span className="font-mono text-[11px] text-tinta-3">
          {coluna.total}
        </span>

        {natureza && <span className="rotulo !text-[9.5px]">{natureza}</span>}

        <span className="flex-grow" />

        {valor && <span className="tabular text-xs text-tinta-3">{valor}</span>}
      </div>

      <div className="flex min-h-24 flex-1 flex-col gap-2.5 overflow-y-auto px-0.5 py-3">
        <SortableContext
          items={coluna.leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {coluna.leads.map((cartao) => (
            <CartaoDoLead
              key={cartao.id}
              cartao={cartao}
              onAbrir={onAbrir}
              fechada={coluna.kind !== "OPEN"}
            />
          ))}
        </SortableContext>

        {coluna.leads.length === 0 && (
          <p className="rounded-[10px] border border-dashed border-filete-forte px-1 py-6 text-center text-xs text-tinta-3">
            Nenhum lead aqui
          </p>
        )}

        {naoListados > 0 && (
          // O quadro carrega os primeiros de cada coluna, não a etapa inteira:
          // uma etapa com dez mil leads não pode obrigar o navegador a receber
          // os dez mil para desenhar cinco colunas.
          <p className="px-1 py-2 text-[12px] text-tinta-3">
            + {naoListados} não exibidos — use a busca ou a visão em tabela
          </p>
        )}
      </div>
    </div>
  )
}

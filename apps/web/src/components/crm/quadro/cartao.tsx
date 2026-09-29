"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { EtiquetaBadge } from "../etiqueta"
import { formatPhone } from "@/utils/formatters"
import type { Cartao } from "@/http/crm/tipos"

/** Reais, a partir do Decimal que a API devolve como string. */
export function emReais(valor: string | null): string | null {
  if (!valor) return null

  const numero = Number(valor)

  if (!Number.isFinite(numero)) return null

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })
}

/**
 * Há quanto tempo o cartão está parado nesta coluna.
 *
 * É o número que faz o quadro valer mais que uma lista: uma proposta parada há
 * três semanas precisa saltar aos olhos de quem abre a tela.
 */
function paradoHa(desde: string | null): string | null {
  if (!desde) return null

  const dias = Math.floor(
    (Date.now() - new Date(desde).getTime()) / (24 * 60 * 60 * 1000)
  )

  if (dias < 1) return "hoje"
  if (dias === 1) return "1 dia"

  return `${dias} dias`
}

export function CartaoDoLead({
  cartao,
  onAbrir,
}: {
  cartao: Cartao
  onAbrir: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cartao.id })

  const valor = emReais(cartao.value)
  const tempo = paradoHa(cartao.stageChangedAt)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onAbrir(cartao.id)}
      className={`cursor-grab rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition active:cursor-grabbing ${
        isDragging ? "opacity-40" : "hover:border-zinc-300 hover:shadow"
      }`}
    >
      <p className="truncate text-sm font-medium text-zinc-900">
        {cartao.name}
      </p>

      <p className="mt-0.5 text-xs text-zinc-500">
        {formatPhone(cartao.remotejid)}
      </p>

      {cartao.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {cartao.tags.map((etiqueta) => (
            <EtiquetaBadge key={etiqueta.id} etiqueta={etiqueta} />
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-emerald-700">
          {valor ?? ""}
        </span>

        <div className="flex items-center gap-2">
          {tempo && (
            <span
              className="text-[11px] text-zinc-400"
              title="Tempo nesta etapa"
            >
              {tempo}
            </span>
          )}

          {cartao.owner && (
            <span
              title={cartao.owner.name}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-700"
            >
              {cartao.owner.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

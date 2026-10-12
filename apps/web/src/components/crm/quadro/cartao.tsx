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
function paradoHa(
  desde: string | null
): { texto: string; dias: number } | null {
  if (!desde) return null

  const dias = Math.floor(
    (Date.now() - new Date(desde).getTime()) / (24 * 60 * 60 * 1000)
  )

  if (dias < 1) return { texto: "hoje", dias }
  if (dias === 1) return { texto: "1 d", dias }

  return { texto: `${dias} d`, dias }
}

/** A partir de quantos dias parado o cartão pede atenção. */
const DIAS_PARADO = 5

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

export function CartaoDoLead({
  cartao,
  onAbrir,
  fechada = false,
}: {
  cartao: Cartao
  onAbrir: (id: string) => void
  /** Etapa de ganho ou perda: ficar nela não é "estar parado". */
  fechada?: boolean
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
      className={`flex cursor-grab flex-col gap-2.5 rounded-[10px] border bg-white p-3.5 transition-[border-color,box-shadow] active:cursor-grabbing ${
        isDragging
          ? "border-acao opacity-50"
          : "border-filete hover:border-filete-forte hover:shadow-[0_6px_16px_rgba(21,19,17,0.07)]"
      }`}
    >
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-grow truncate text-[13.5px] font-semibold text-tinta">
          {cartao.name}
        </p>

        {!fechada && tempo && tempo.dias >= DIAS_PARADO && (
          <span
            className="shrink-0 rounded-[5px] bg-ambar-fundo px-1.5 py-0.5 text-[11px] font-semibold text-ambar"
            title="Parado nesta etapa"
          >
            parado {tempo.texto}
          </span>
        )}
      </div>

      <p className="line-clamp-2 text-[12.5px] leading-normal text-tinta-2">
        {cartao.briefing || formatPhone(cartao.remotejid)}
      </p>

      {cartao.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cartao.tags.map((etiqueta) => (
            <EtiquetaBadge key={etiqueta.id} etiqueta={etiqueta} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-[#F1EEE8] pt-2.5 text-xs text-tinta-3">
        <span className="tabular text-[13px] font-semibold text-tinta">
          {valor ?? ""}
        </span>

        <span className="flex-grow" />

        {tempo && (fechada || tempo.dias < DIAS_PARADO) && (
          <span className="tabular" title="Tempo nesta etapa">
            {tempo.texto}
          </span>
        )}

        {cartao.owner && (
          <span
            title={cartao.owner.name}
            className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-tinta text-[9.5px] font-semibold text-papel"
          >
            {iniciais(cartao.owner.name)}
          </span>
        )}
      </div>
    </div>
  )
}

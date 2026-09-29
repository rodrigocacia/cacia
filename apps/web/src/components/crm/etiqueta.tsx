import type { Etiqueta } from "@/http/crm/tipos"

/**
 * Cor de texto legível sobre a cor da etiqueta.
 *
 * A cor é escolhida livremente pelo escritório; texto branco fixo some sobre
 * um amarelo, e preto fixo some sobre um azul-marinho. A luminância relativa
 * decide qual dos dois.
 */
function contraste(hex: string): string {
  const limpo = hex.replace("#", "")

  if (limpo.length !== 6) return "#111827"

  const r = parseInt(limpo.slice(0, 2), 16) / 255
  const g = parseInt(limpo.slice(2, 4), 16) / 255
  const b = parseInt(limpo.slice(4, 6), 16) / 255

  // Coeficientes da luminância relativa (WCAG)
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b

  return luminancia > 0.6 ? "#111827" : "#FFFFFF"
}

export function EtiquetaBadge({
  etiqueta,
  onRemover,
}: {
  etiqueta: Etiqueta
  onRemover?: () => void
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight"
      style={{
        backgroundColor: etiqueta.color,
        color: contraste(etiqueta.color),
      }}
    >
      {etiqueta.name}

      {onRemover && (
        <button
          type="button"
          onClick={onRemover}
          aria-label={`Remover etiqueta ${etiqueta.name}`}
          className="opacity-70 transition hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  )
}

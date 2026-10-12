import { ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const BOTAO =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-filete-forte bg-white text-tinta-2 transition-colors hover:bg-gray-100 hover:text-tinta"

/** Título do período exibido e as setas de navegação das grades da agenda. */
export function CabecalhoDaGrade({
  titulo,
  sobretitulo,
  aoNavegar,
}: {
  titulo: ReactNode
  sobretitulo?: ReactNode
  aoNavegar: (direcao: "prev" | "next") => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-filete px-5 py-4">
      <div className="flex min-w-0 flex-col gap-1">
        {sobretitulo && <span className="rotulo">{sobretitulo}</span>}
        <h2 className="truncate font-display text-[26px] leading-none text-tinta first-letter:uppercase">
          {titulo}
        </h2>
      </div>

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          aria-label="Período anterior"
          className={BOTAO}
          onClick={() => aoNavegar("prev")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Próximo período"
          className={BOTAO}
          onClick={() => aoNavegar("next")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

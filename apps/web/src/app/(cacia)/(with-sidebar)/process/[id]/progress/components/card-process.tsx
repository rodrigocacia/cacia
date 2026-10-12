import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Progress } from "@/types/progress"

interface CardProgressProps {
  progress: Progress
}

/** Um andamento na linha do tempo do processo. */
export function CardProgress({ progress }: CardProgressProps) {
  const formattedDate = progress.release_at
    ? format(new Date(progress.release_at), "dd MMM yyyy", { locale: ptBR })
    : ""

  return (
    <li className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-b border-[#F1EEE8] px-5 py-3.5 last:border-b-0 max-sm:grid-cols-1 max-sm:gap-1">
      <span className="tabular pt-px text-xs text-tinta-3">
        {formattedDate}
      </span>
      <p className="text-[13.5px] leading-[1.5] text-tinta">
        {progress?.title}
      </p>
    </li>
  )
}

"use client"

import { ProcessStatus, processStatusConfig } from "@/types/process"

interface ProcessBadgeProps {
  variant?: ProcessStatus
}

const PONTO: Record<ProcessStatus, string> = {
  [ProcessStatus.PENDING]: "bg-ambar-ponto",
  [ProcessStatus.ACTIVE]: "bg-acao",
  [ProcessStatus.ARCHIVED]: "bg-gray-400",
  [ProcessStatus.CONCLUDED]: "bg-turquesa-profundo",
  [ProcessStatus.FINISHED]: "bg-turquesa-profundo",
}

/** Etiqueta de status do processo: contorno fino e um ponto colorido. */
export function ProcessBadge({
  variant = ProcessStatus.ACTIVE,
}: ProcessBadgeProps) {
  const config =
    processStatusConfig[variant] || processStatusConfig[ProcessStatus.ACTIVE]
  const ponto = PONTO[variant] ?? PONTO[ProcessStatus.ACTIVE]

  return (
    <span className="inline-flex h-[22px] w-fit shrink-0 items-center gap-1.5 rounded-md border border-[#E3DED6] bg-white px-2 text-xs whitespace-nowrap text-tinta-2">
      <span className={`h-1.5 w-1.5 rounded-full ${ponto}`} />
      {config.label}
    </span>
  )
}

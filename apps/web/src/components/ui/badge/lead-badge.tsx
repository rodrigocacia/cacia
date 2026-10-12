"use client"

import { LeadStatus } from "@/types/lead-status"

interface LeadBadgeProps {
  variant?: LeadStatus
}

const badgeStyles: Record<LeadStatus, { ponto: string; label: string }> = {
  NEW: { ponto: "bg-acao", label: "Novo" },
  CONVERTED: { ponto: "bg-turquesa-profundo", label: "Convertido" },
  IN_CONTACT: { ponto: "bg-ambar-ponto", label: "Em contato" },
  LOST: { ponto: "bg-[#C2513E]", label: "Perdido" },
}

/** Etiqueta de status do lead: contorno fino e um ponto colorido. */
export function LeadBadge({ variant = "NEW" }: LeadBadgeProps) {
  // Status desconhecido não pode derrubar a tela inteira: cai no "Novo".
  const style = badgeStyles[variant] ?? badgeStyles.NEW

  return (
    <span className="inline-flex h-[22px] w-fit shrink-0 items-center gap-1.5 rounded-md border border-[#E3DED6] bg-white px-2 text-xs whitespace-nowrap text-tinta-2">
      <span className={`h-1.5 w-1.5 rounded-full ${style.ponto}`} />
      {style.label}
    </span>
  )
}

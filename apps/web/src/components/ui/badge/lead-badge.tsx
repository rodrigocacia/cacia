"use client"

import { clsx } from "clsx"
import { Icon } from "@iconify/react"
import { LeadStatus } from "@/types/lead-status"

interface LeadBadgeProps {
  variant?: LeadStatus
}

const badgeStyles = {
  new: {
    bg: "bg-[#ECF7F8]",
    text: "text-[#348C98]",
    icon: "mdi:record",
    label: "Novo",
  },
  converted: {
    bg: "bg-[#EDFDEE]",
    text: "text-[#16A31B]",
    icon: "mdi:account-check-outline",
    label: "Convertido",
  },
  in_contact: {
    bg: "bg-[#FEFBEB]",
    text: "text-[#F7CB08]",
    icon: "mdi:message-fast-outline",
    label: "Em contato",
  },
}

export function LeadBadge({ variant = "new" }: LeadBadgeProps) {
  const style = badgeStyles[variant]

  return (
    <div
      className={clsx(
        "w-fit px-3 py-1.5 max-md:px-2 max-md:py-1 rounded-full flex items-center gap-1",
        style.bg
      )}
    >
      <Icon
        icon={style.icon}
        className={clsx("w-4 h-4 max-md:w-2.5 max-md:h-2.5", style.text)}
      />

      <span
        className={clsx("text-sm max-md:text-[10px] font-semibold", style.text)}
      >
        {style.label}
      </span>
    </div>
  )
}

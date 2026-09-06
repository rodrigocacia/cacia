"use client"

import { clsx } from "clsx"
import { Icon } from "@/components/icone"
import { ProcessStatus, processStatusConfig } from "@/types/process"

interface ProcessBadgeProps {
  variant?: ProcessStatus
}

export function ProcessBadge({
  variant = ProcessStatus.ACTIVE,
}: ProcessBadgeProps) {
  const config =
    processStatusConfig[variant] || processStatusConfig[ProcessStatus.ACTIVE]

  return (
    <div
      className={clsx(
        "w-fit px-3 py-1.5 max-md:px-2 max-md:py-1 rounded-full flex items-center gap-1",
        config.color
      )}
    >
      <Icon
        icon={config.icon || "mdi:folder-clock-outline"}
        className={clsx(
          "w-4 h-4 max-md:w-2.5 max-md:h-2.5",
          config.text || "text-[#F7CB08]"
        )}
      />

      <span
        className={clsx(
          "text-sm max-md:text-[10px] font-semibold",
          config.text || "text-[#F7CB08]"
        )}
      >
        {config.label}
      </span>
    </div>
  )
}

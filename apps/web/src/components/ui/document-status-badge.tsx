import { DocumentStatus, documentStatusConfig } from "@/types/document"
import { Icon } from "@iconify/react"

interface DocumentStatusBadgeProps {
  status: DocumentStatus
  className?: string
}

export function DocumentStatusBadge({
  status,
  className = "",
}: DocumentStatusBadgeProps) {
  const config = documentStatusConfig[status]

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.text} ${className}`}
    >
      <Icon icon={config.icon} className="size-4" />
      {config.label}
    </div>
  )
}

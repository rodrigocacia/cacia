import { clsx } from "clsx"
import { DocumentStatus, documentStatusConfig } from "@/types/document"

interface DocumentStatusBadgeProps {
  status: DocumentStatus
  className?: string
}

/** Cor do ponto por status — o rótulo continua vindo de documentStatusConfig. */
const PONTO: Record<DocumentStatus, string> = {
  [DocumentStatus.DRAFT]: "bg-gray-400",
  [DocumentStatus.PENDING_REVIEW]: "bg-ambar-ponto",
  [DocumentStatus.APPROVED]: "bg-[#3E8E5A]",
  [DocumentStatus.SENT]: "bg-acao",
}

export function DocumentStatusBadge({
  status,
  className = "",
}: DocumentStatusBadgeProps) {
  const config = documentStatusConfig[status]
  if (!config) return null

  return (
    <span
      className={clsx(
        "inline-flex h-[22px] w-fit shrink-0 items-center gap-1.5 rounded-md border border-[#E3DED6] bg-white px-2 text-xs font-medium whitespace-nowrap text-tinta-2",
        className
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          PONTO[status] ?? "bg-gray-400"
        )}
      />
      {config.label}
    </span>
  )
}

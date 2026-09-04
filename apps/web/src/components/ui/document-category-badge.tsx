import { DocumentCategory, documentCategoryConfig } from "@/types/document"
import { Icon } from "@iconify/react"

interface DocumentCategoryBadgeProps {
  category: DocumentCategory
  className?: string
}

export function DocumentCategoryBadge({
  category,
}: DocumentCategoryBadgeProps) {
  const config = documentCategoryConfig[category]

  return (
    <div
      className={
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-[#348C98] bg-[#ECF7F8]"
      }
    >
      <Icon icon={config.icon} className="size-4" />
      {config.label}
    </div>
  )
}

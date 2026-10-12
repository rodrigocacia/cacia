import { DocumentCategory, documentCategoryConfig } from "@/types/document"
import { Icon } from "@/components/icone"

interface DocumentCategoryBadgeProps {
  category: DocumentCategory
  className?: string
}

/** Categoria é classificação, não status: etiqueta neutra com o ícone. */
export function DocumentCategoryBadge({
  category,
}: DocumentCategoryBadgeProps) {
  const config = documentCategoryConfig[category]
  if (!config) return null

  return (
    <span className="inline-flex h-[22px] w-fit shrink-0 items-center gap-1.5 rounded-md border border-[#E3DED6] bg-white px-2 text-xs font-medium whitespace-nowrap text-tinta-2">
      <Icon icon={config.icon} className="size-3.5 text-tinta-3" />
      {config.label}
    </span>
  )
}

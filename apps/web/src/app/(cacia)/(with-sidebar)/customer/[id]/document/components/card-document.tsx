import { Eye, Trash2 } from "lucide-react"

import { RowActions } from "@/components/ui/row-actions"
import { ExtensionIcon } from "@/components/ui/extension-icon"
import { Customer } from "@/types/customer"
import { Process } from "@/types/process"
import { formatProcess } from "@/utils/formatters"
import { format } from "date-fns"
import { DocumentStatus, DocumentType } from "@/types/document"
import { DocumentStatusBadge } from "@/components/ui/document-status-badge"
import { ptBR } from "date-fns/locale"

interface CardDocumentProps {
  document: {
    _id: string
    title: string
    extension: string
    content_url?: string
    type?: DocumentType
    status?: DocumentStatus
    created_at?: string
    updated_at?: string
    process?: Process
  }
  customer: Customer
  handleOpenDialog?: (document: CardDocumentProps["document"]) => void
  onDelete?: (documentId: string, title: string) => void
}

export function CardDocument({
  document,
  customer,
  handleOpenDialog,
  onDelete,
}: CardDocumentProps) {
  const formattedDate = format(
    new Date(document.updated_at ?? document.created_at ?? new Date()),
    "dd MMM yyyy",
    { locale: ptBR }
  )

  return (
    <li className="group/row flex min-h-14 items-center gap-3 border-b border-[#F1EEE8] px-5 py-2.5 transition-colors last:border-b-0 hover:bg-papel">
      <button
        type="button"
        onClick={() => handleOpenDialog?.(document)}
        className="flex min-w-0 flex-grow cursor-pointer items-center gap-3 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-papel-2">
          <ExtensionIcon
            type={document.type}
            extension={document.extension}
            className="h-[18px] w-[18px]"
          />
        </span>

        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13.5px] font-medium text-tinta">
            {document?.title}.{document?.extension}
          </span>
          <span className="tabular truncate text-xs text-tinta-3">
            {[
              customer?.name,
              document?.process?.number
                ? `Processo ${formatProcess(document.process.number)}`
                : null,
              formattedDate,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
      </button>

      {document.type === DocumentType.CREATE && document.status && (
        <DocumentStatusBadge
          status={document.status as DocumentStatus}
          className="max-sm:hidden"
        />
      )}

      <RowActions
        actions={[
          {
            label: "Ver",
            onClick: () => handleOpenDialog?.(document),
            icon: <Eye strokeWidth={1.7} />,
          },
          ...(onDelete
            ? [
                {
                  label: "Excluir",
                  onClick: () => onDelete(document._id, document.title),
                  icon: <Trash2 strokeWidth={1.7} />,
                  danger: true,
                },
              ]
            : []),
        ]}
      />
    </li>
  )
}

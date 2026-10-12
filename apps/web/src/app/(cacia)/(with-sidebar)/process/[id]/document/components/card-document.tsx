"use client"

import { Eye, Trash2 } from "lucide-react"

import { RowActions } from "@/components/ui/row-actions"
import { ExtensionIcon } from "@/components/ui/extension-icon"
import { Process } from "@/types/process"
import { DocumentType, DocumentStatus } from "@/types/document"
import { formatProcess } from "@/utils/formatters"

interface CardDocumentProps {
  document: {
    _id: string
    title: string
    extension: string
    content_url?: string
    type?: DocumentType
    status?: DocumentStatus
    updated_at?: string
  }
  process: Process
  handleOpenDialog?: (document: CardDocumentProps["document"]) => void
  onDelete?: (documentId: string, title: string) => void
}

export function CardDocument({
  document,
  process,
  handleOpenDialog,
  onDelete,
}: CardDocumentProps) {
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
              process?.customer?.name,
              process?.number
                ? `Processo ${formatProcess(process.number)}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
      </button>

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

import { Eye, Trash2 } from "lucide-react"
import { DocumentStatusBadge } from "@/components/ui/document-status-badge"
import { RowActions } from "@/components/ui/row-actions"
import { Document } from "../(detail)/detail"
import { ExtensionIcon } from "@/components/ui/extension-icon"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DocumentType, DocumentStatus } from "@/types/document"
import { formatProcess } from "@/utils/formatters"
import Link from "next/link"

interface CardDocumentProps {
  document: {
    _id: string
    title: string
    extension: string
    content_url: string
    customer?: {
      _id: string
      name: string
      remotejid: string
      email: string
    }
    process?: {
      _id: string
      customer: string
      unit: string
      number: string
    }
    lead?: {
      _id: string
      name: string
      number: string
    }
    status?: string
    type?: string
    updated_at: string
  }
  handleOpenDialog: (document: Document) => void
  handleAddDeleteDocumentId?: (documentId: string) => void
  isSystemFolder?: boolean
}

export function CardDocument({
  document,
  handleOpenDialog,
  handleAddDeleteDocumentId,
  isSystemFolder,
}: CardDocumentProps) {
  const formattedDate = format(new Date(document.updated_at), "dd MMM yyyy", {
    locale: ptBR,
  })

  const link = "hover:text-turquesa-profundo hover:underline"

  return (
    <li className="group/row flex min-h-14 items-center gap-3 border-b border-[#F1EEE8] px-5 py-2.5 transition-colors last:border-b-0 hover:bg-papel">
      <button
        type="button"
        onClick={() => handleOpenDialog(document)}
        aria-label={`Abrir ${document?.title}`}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-papel-2"
      >
        <ExtensionIcon
          type={document.type}
          extension={document.extension}
          className="h-[18px] w-[18px]"
        />
      </button>

      <div className="flex min-w-0 flex-grow flex-col">
        <button
          type="button"
          onClick={() => handleOpenDialog(document)}
          className="w-fit max-w-full cursor-pointer truncate text-left text-[13.5px] font-medium text-tinta hover:underline"
        >
          {document?.title}
        </button>

        <p className="tabular flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-tinta-3">
          {document.lead && document.lead.name && (
            <>
              <span className="truncate">
                {document.type === DocumentType.CREATE && "Solicitado por "}
                {document.type === DocumentType.ATTACHMENT && "Enviado por "}
                <Link
                  href={`/lead?leadId=${document.lead._id}`}
                  className={link}
                >
                  {document.lead.name}
                </Link>
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          {document.customer && document.customer.name && (
            <>
              <Link
                href={`/customer?customerId=${document.customer._id}`}
                className={`truncate ${link}`}
              >
                {document.customer.name}
              </Link>
              <span aria-hidden>·</span>
            </>
          )}
          {document.process && (
            <>
              <Link
                href={`/process?processId=${document.process._id}`}
                className={`truncate ${link}`}
              >
                Processo {formatProcess(document.process?.number)}
              </Link>
              <span aria-hidden>·</span>
            </>
          )}
          <span>{formattedDate}</span>
        </p>
      </div>

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
            onClick: () => handleOpenDialog(document),
            icon: <Eye strokeWidth={1.7} />,
          },
          ...(handleAddDeleteDocumentId && !isSystemFolder
            ? [
                {
                  label: "Excluir",
                  onClick: () => handleAddDeleteDocumentId(document?._id),
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

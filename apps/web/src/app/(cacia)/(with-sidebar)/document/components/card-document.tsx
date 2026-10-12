import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Eye, Trash2 } from "lucide-react"

import { ExtensionIcon } from "@/components/ui/extension-icon"
import { DocumentStatusBadge } from "@/components/ui/document-status-badge"
import { RowActions } from "@/components/ui/row-actions"
import { Folder } from "@/types/folder"
import { DocumentType } from "@/types/document"

interface CardFolderProps {
  folder: Folder
  onOpen?: () => void
  onDelete?: (
    folderId: string,
    title: string,
    type: "folder" | "document"
  ) => void
}

/** Linha de pasta ou documento na listagem de Documentos. */
export function CardDocument({ folder, onOpen, onDelete }: CardFolderProps) {
  const formattedDate = folder.updated_at
    ? format(new Date(folder.updated_at), "dd MMM yyyy", { locale: ptBR })
    : null

  const isCreateDocument = folder.type === DocumentType.CREATE
  const isAttachmentDocument = folder.type === DocumentType.ATTACHMENT

  const pessoa = folder.lead?.name
    ? `${isCreateDocument ? "Solicitado por " : isAttachmentDocument ? "Enviado por " : ""}${folder.lead.name}`
    : folder.customer?.name

  const meta = [
    folder.type ? null : "Pasta",
    pessoa,
    folder.process?.name,
    formattedDate,
  ].filter(Boolean)

  return (
    <li className="group/row flex min-h-14 items-center gap-3 border-b border-[#F1EEE8] px-5 py-2.5 transition-colors last:border-b-0 hover:bg-papel">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-grow cursor-pointer items-center gap-3 text-left"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            folder.type ? "bg-papel-2" : "bg-nevoa"
          }`}
        >
          <ExtensionIcon
            type={folder.type}
            extension={folder.extension}
            className="h-[18px] w-[18px]"
          />
        </span>

        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13.5px] font-medium text-tinta">
            {folder?.title}
          </span>
          {meta.length > 0 && (
            <span className="tabular truncate text-xs text-tinta-3">
              {meta.join(" · ")}
            </span>
          )}
        </span>
      </button>

      {isCreateDocument && folder.status && (
        <DocumentStatusBadge status={folder.status} className="max-sm:hidden" />
      )}

      <RowActions
        actions={[
          {
            label: folder.type ? "Ver" : "Abrir pasta",
            onClick: onOpen,
            icon: <Eye strokeWidth={1.7} />,
          },
          ...(onDelete && !folder.system
            ? [
                {
                  label: "Excluir",
                  onClick: () =>
                    onDelete(
                      folder._id,
                      folder.title,
                      folder.type ? "document" : "folder"
                    ),
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

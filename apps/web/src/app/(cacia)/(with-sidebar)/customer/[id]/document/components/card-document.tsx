import { Icon } from "@/components/icone"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { ExtensionIcon } from "@/components/ui/extension-icon"
import { MoreVertical } from "lucide-react"
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
    "d 'de' MMMM, yyyy",
    { locale: ptBR }
  )

  return (
    <div className="bg-white px-2 py-3 flex items-center justify-between gap-2.5 border border-[#F6F6F9] rounded-[12px]">
      <div
        onClick={() => handleOpenDialog?.(document)}
        className="cursor-pointer flex gap-2.5"
      >
        <div className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-[#ECF7F8]">
          <ExtensionIcon type={document.type} extension={document.extension} />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className=" text-sm text-[#707070] font-semibold">
            {document?.title}.{document?.extension}
          </h3>

          <div className="w-full flex items-center gap-2">
            <p className="text-xs text-[#707070] pr-2.5 border-r border-[#EFEFEF]">
              {customer?.name}
            </p>

            <div className="flex items-center gap-[3px]">
              <Icon
                icon="mdi:folder-text-outline"
                className="w-3 h-3 text-[#BDBDBD]"
              />

              <span className="text-[10px] text-[#707070]">
                Processo:{" "}
                {document?.process?.number
                  ? formatProcess(document.process.number)
                  : "N/A"}
              </span>
            </div>
          </div>

          <div className="w-full flex items-center gap-2">
            <p className="text-[10px] text-[#707070]">
              <span>{formattedDate ?? ""}</span>
            </p>
            {document.type === DocumentType.CREATE && document.status && (
              <DocumentStatusBadge
                status={document.status as DocumentStatus}
                className="text-xs"
              />
            )}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleOpenDialog?.(document)}>
            <div className="flex items-center gap-2">
              <Icon icon="mdi:eye" className="text-[#BDBDBD] w-5 h-5" />
              <p className="text-base text-[#3D3D3D]">Ver</p>
            </div>
          </DropdownMenuItem>

          {onDelete && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete(document._id, document.title)
              }}
            >
              <div className="flex items-center gap-2">
                <Icon icon="mdi:delete" className="text-[#DC2626] w-5 h-5" />
                <p className="text-base text-[#3D3D3D]">Excluir</p>
              </div>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

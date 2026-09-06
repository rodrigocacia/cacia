import { Icon } from "@/components/icone"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DocumentStatusBadge } from "@/components/ui/document-status-badge"

import { Button } from "@/components/ui/button"
import { FileIcon, MoreVertical, UserIcon } from "lucide-react"
import { Document } from "../(detail)/detail"
import { ExtensionIcon } from "@/components/ui/extension-icon"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DocumentType, DocumentStatus } from "@/types/document"
import { formatProcess, formatName } from "@/utils/formatters"
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
  const formattedDate = format(
    new Date(document.updated_at),
    "d 'de' MMMM, yyyy",
    { locale: ptBR }
  )

  return (
    <div className="bg-white px-2 py-3 flex items-center justify-between gap-2.5 border border-[#F6F6F9] rounded-[12px]">
      <div className="w-full flex gap-2.5">
        <div
          onClick={() => handleOpenDialog(document)}
          className=" w-11 h-11 flex items-center justify-center rounded-[12px] bg-[#ECF7F8] cursor-pointer"
        >
          <ExtensionIcon type={document.type} extension={document.extension} />
        </div>

        <div className="flex flex-col gap-1 justify-start">
          <h3
            onClick={() => handleOpenDialog(document)}
            className=" text-sm text-[#707070] font-semibold cursor-pointer"
          >
            {document?.title}
          </h3>

          <div className="w-full flex items-center gap-2.5">
            {document.lead && document.lead.name && (
              <p className="text-xs text-[#707070] pr-2.5 border-r border-[#EFEFEF]">
                <span className="flex items-center gap-1">
                  {document.type === DocumentType.CREATE && "Solicitado por: "}
                  {document.type === DocumentType.ATTACHMENT && "Enviado por: "}
                  <UserIcon className="w-3 h-3 text-[#348C98]" />
                  <Link href={`/lead?leadId=${document.lead._id}`}>
                    <span className="text-[#348C98] cursor-pointer hover:underline">
                      {formatName(document.lead?.name.split(" ")[0])}{" "}
                      {formatName(document.lead?.name.split(" ")[1] || "")}
                    </span>
                  </Link>
                </span>
              </p>
            )}
            {document.customer && document.customer.name && (
              <p className="text-xs text-[#707070] pr-2.5 border-r border-[#EFEFEF]">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3 h-3 text-[#348C98]" />
                  <Link
                    href={`/customer?customerId=${document.customer._id}`}
                    className="text-[#348C98]"
                  >
                    {formatName(document.customer?.name.split(" ")[0])}{" "}
                    {formatName(document.customer?.name.split(" ")[1] || "")}
                  </Link>
                </span>
              </p>
            )}
            {document.process && (
              <div className="text-xs text-[#707070] pr-2.5 border-r border-[#EFEFEF]">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1">
                    <FileIcon className="w-3 h-3 text-[#348C98]" />
                    <span className="text-[#348C98]">Processo</span>
                  </span>
                  <Link
                    href={`/process?processId=${document.process._id}`}
                    className="text-[#348C98]"
                  >
                    {formatProcess(document.process?.number)?.length > 15
                      ? `${formatProcess(document.process?.number).slice(
                          0,
                          15
                        )}...`
                      : formatProcess(document.process?.number)}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="w-full flex items-center gap-2.5">
            <p className="text-[10px] text-[#707070] pr-2.5 border-r border-[#EFEFEF]">
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
          <DropdownMenuItem onClick={() => handleOpenDialog(document)}>
            <div className="flex items-center gap-2">
              <Icon icon="mdi:eye" className="text-[#BDBDBD] w-5 h-5" />

              <p className="text-base text-[#3D3D3D]">Ver</p>
            </div>
          </DropdownMenuItem>

          {handleAddDeleteDocumentId && !isSystemFolder && (
            <DropdownMenuItem
              onClick={() => handleAddDeleteDocumentId(document?._id)}
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

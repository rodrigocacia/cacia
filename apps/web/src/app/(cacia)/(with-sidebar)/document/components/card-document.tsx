import { ExtensionIcon } from "@/components/ui/extension-icon"
import { DocumentStatusBadge } from "@/components/ui/document-status-badge"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { FileIcon, MoreVertical, UserIcon } from "lucide-react"
import { Folder } from "@/types/folder"
import { DocumentType } from "@/types/document"
import { formatName } from "@/utils/formatters"
import { Icon } from "@/components/icone"

interface CardFolderProps {
  folder: Folder
  onDelete?: (
    folderId: string,
    title: string,
    type: "folder" | "document"
  ) => void
}

export function CardDocument({ folder, onDelete }: CardFolderProps) {
  const formattedDate = format(
    new Date(folder.updated_at),
    "d 'de' MMMM, yyyy",
    { locale: ptBR }
  )

  const isCreateDocument = folder.type === DocumentType.CREATE
  const isAttachmentDocument = folder.type === DocumentType.ATTACHMENT

  return (
    <div className="px-2 py-3 flex items-center bg-white justify-between gap-2.5 border border-[#F6F6F9] rounded-[12px]">
      <div className="flex gap-2.5">
        <div className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-[#ECF7F8]">
          <ExtensionIcon type={folder.type} extension={folder.extension} />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className=" text-sm text-[#707070] font-semibold">
            {folder?.title}
          </h3>

          <div className="w-full flex items-center gap-2.5">
            {folder.lead && folder.lead.name && (
              <p className="text-xs text-[#707070] pr-2.5 border-r border-[#EFEFEF]">
                <span className="flex items-center gap-1">
                  {isCreateDocument && "Solicitado por: "}
                  {isAttachmentDocument && "Enviado por: "}
                  <UserIcon className="w-3 h-3 text-[#348C98]" />
                  <span className="text-[#348C98]">
                    {formatName(folder.lead.name.split(" ")[0])}{" "}
                    {formatName(folder.lead.name.split(" ")[1] || "")}
                  </span>
                </span>
              </p>
            )}
            {folder.customer && folder.customer.name && (
              <p className="text-xs text-[#707070] pr-2.5 border-r border-[#EFEFEF]">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3 h-3 text-[#348C98]" />
                  <span className="text-[#348C98]">
                    {formatName(folder.customer.name.split(" ")[0])}{" "}
                    {formatName(folder.customer.name.split(" ")[1] || "")}
                  </span>
                </span>
              </p>
            )}
            {folder.process && folder.process.name && (
              <p className="text-xs text-[#707070] pr-2.5 border-r border-[#EFEFEF]">
                <span className="flex items-center gap-1">
                  <FileIcon className="w-3 h-3 text-[#348C98]" />
                  <span className="text-[#348C98]">
                    {folder.process.name.slice(0, 8)}...
                  </span>
                </span>
              </p>
            )}
          </div>

          <div className="w-full flex items-center gap-2.5">
            <p className="text-xs text-[#707070] pr-2.5 border-r border-[#EFEFEF]">
              <span>{formattedDate ?? ""}</span>
            </p>
            {isCreateDocument && folder.status && (
              <DocumentStatusBadge status={folder.status} className="text-xs" />
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
          <DropdownMenuItem>
            <div className="flex items-center gap-2">
              <Icon icon="mdi:eye" className="text-[#BDBDBD] w-5 h-5" />
              <p className="text-base text-[#3D3D3D]">Ver</p>
            </div>
          </DropdownMenuItem>

          {onDelete && !folder.system && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                const itemType = folder.type ? "document" : "folder"
                onDelete(folder._id, folder.title, itemType)
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

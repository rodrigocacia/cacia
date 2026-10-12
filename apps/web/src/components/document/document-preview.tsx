"use client"

import { Document } from "@/types/document"
import { Icon } from "@/components/icone"

interface DocumentPreviewProps {
  document: Document
  onEdit?: () => void
  onDownloadPdf?: () => void
}

export function DocumentPreview({
  document,
  onEdit,
  onDownloadPdf,
}: DocumentPreviewProps) {
  if (!document.content) {
    return (
      <div className="flex h-96 items-center justify-center text-tinta-3">
        <div className="text-center">
          <Icon
            icon="mdi:file-document-outline"
            className="size-16 mx-auto mb-4 opacity-50"
          />
          <p>Nenhum conteúdo disponível para visualização</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-[13px] text-tinta-3">
          Criado em: {new Date(document.created_at).toLocaleDateString("pt-BR")}
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex h-9 w-fit cursor-pointer items-center gap-2 rounded-[9px] border border-filete-forte bg-white px-3.5 text-tinta transition-colors hover:bg-gray-100 disabled:opacity-60"
            >
              <Icon icon="mdi:pencil" className="size-4" />
              <span className="text-[13.5px] font-medium">Editar</span>
            </button>
          )}
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              className="flex h-9 w-fit cursor-pointer items-center gap-2 rounded-[9px] border border-filete-forte bg-white px-3.5 text-tinta transition-colors hover:bg-gray-100 disabled:opacity-60"
            >
              <span className="text-[13.5px] font-medium">Baixar PDF</span>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-filete">
        <div
          className="document-content p-4 bg-white min-h-[300px] max-h-[full] md:max-h-[600px] overflow-y-none md:overflow-y-auto prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none max-w-none"
          dangerouslySetInnerHTML={{ __html: document.content }}
        />
      </div>
    </div>
  )
}

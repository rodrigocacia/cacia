"use client"

import { Document } from "@/types/document"
import { Icon } from "@iconify/react"

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
      <div className="flex items-center justify-center h-96 text-gray-500">
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
        <div className="text-sm text-gray-600">
          Criado em: {new Date(document.created_at).toLocaleDateString("pt-BR")}
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="cursor-pointer flex w-fit px-[30px] py-3 items-center gap-2 rounded-full border border-[#CDEDF0] bg-white text-[#2C8B94] shadow-sm hover:bg-[#f7fdfd] transition-colors"
            >
              <Icon icon="mdi:pencil" className="size-4" />
              <span className="text-base font-medium">editar</span>
            </button>
          )}
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              className="cursor-pointer flex w-fit px-[30px] py-3 items-center gap-2 rounded-full border border-[#CDEDF0] bg-white text-[#2C8B94] shadow-sm hover:bg-[#f7fdfd] transition-colors"
            >
              <span className="text-base font-medium">Baixar PDF</span>
            </button>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div
          className="document-content p-4 bg-white min-h-[300px] max-h-[full] md:max-h-[600px] overflow-y-none md:overflow-y-auto prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none max-w-none"
          dangerouslySetInnerHTML={{ __html: document.content }}
        />
      </div>
    </div>
  )
}

"use client"

import { Icon } from "@iconify/react/dist/iconify.js"
import { CardDocument } from "../components/card-document"
import { Form } from "../new/form"
import { EmptySearch } from "@/components/empty-search"
import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DialogDeleteDocument } from "../components/dialog-delete-document"
import { Toast } from "@/components/ui/toast"
import {
  DocumentViewerModal,
  DocumentViewer,
} from "@/components/ui/document-viewer-modal"
import { DocumentApprovalModal } from "@/components/document/document-approval-modal"
import { DocumentType, DocumentStatus } from "@/types/document"

export interface Document {
  _id: string
  title: string
  extension: string
  content_url: string
  updated_at: string
  type?: string
  status?: string
  lead?: {
    _id: string
    name: string
    number: string
  }
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
}

interface DocumentDetailProps {
  documents: {
    _id: string
    title: string
    extension: string
    content_url: string
    updated_at: string
    type?: string
    status?: string
    lead?: {
      _id: string
      name: string
      number: string
    }
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
  }[]
  folderId: string
  isSystemFolder?: boolean
}

function toDocumentViewer(document: Document | null): DocumentViewer | null {
  if (!document) return null
  return {
    _id: document._id,
    title: document.title,
    extension: document.extension ?? "",
    content_url: document.content_url ?? "",
    updated_at: document.updated_at ?? "",
    type: document.type ?? "",
    lead: document.lead
      ? {
          _id: document.lead._id,
          name: document.lead.name,
          remotejid: "",
          email: "",
        }
      : undefined,
    customer: document.customer,
  }
}

export function DocumentDetail({
  documents,
  folderId,
  isSystemFolder,
}: DocumentDetailProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [isSuccess, setIsSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  )

  const deleteId = searchParams.get("deleteId")

  const handleOpenDialog = useCallback((document: Document) => {
    if (!document.type) {
      setSelectedDocument(document)
      setIsViewerModalOpen(true)
      return
    }

    if (
      document.type === DocumentType.UPLOAD ||
      document.type === DocumentType.ATTACHMENT
    ) {
      setSelectedDocument(document)
      setIsViewerModalOpen(true)
      return
    }

    if (document.type === DocumentType.CREATE) {
      if (
        document.status === DocumentStatus.APPROVED ||
        document.status === DocumentStatus.SENT
      ) {
        setSelectedDocument(document)
        setIsViewerModalOpen(true)
      } else if (
        document.status === DocumentStatus.PENDING_REVIEW ||
        document.status === DocumentStatus.DRAFT
      ) {
        setSelectedDocument(document)
        setIsApprovalModalOpen(true)
      }
    }
  }, [])

  const handleCloseApprovalModal = useCallback(() => {
    setIsApprovalModalOpen(false)
  }, [])

  const handleAddDeleteQuestionId = (questionId: string) => {
    const params = new URLSearchParams(searchParams)

    params.set("deleteId", questionId)

    router.push(`/document/${folderId}?${params.toString()}`)
  }

  const handleRemoveDeleteQuestionId = () => {
    const params = new URLSearchParams(searchParams)

    params.delete("deleteId")

    router.push(`/document/${folderId}?${params.toString()}`)
  }

  return (
    <div className="p-8 max-md:p-0 md:rounded-2xl md:shadow-sm max-md:mt-6">
      <div className="w-full flex items-center gap-3 max-md:hidden">
        <Icon
          icon="mdi:file-document-outline"
          className="text-[#BDBDBD] w-8 h-8"
        />

        <h3 className="text-[20px] text-[#707070] font-bold">Arquivos</h3>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <div className="h-full w-full mt-6 flex flex-col justify-between gap-8">
        <div className="w-full flex flex-col gap-4">
          {documents?.length === 0 ? (
            <EmptySearch title="Sem documentos cadastrados" subtitle="" />
          ) : null}

          {documents?.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-[1600px]:grid-cols-1">
              {documents?.map((document) => (
                <CardDocument
                  key={document?._id}
                  document={document}
                  handleOpenDialog={handleOpenDialog}
                  handleAddDeleteDocumentId={handleAddDeleteQuestionId}
                  isSystemFolder={isSystemFolder}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="w-full flex items-center justify-end max-md:flex-col">
          <Form />
        </div>
      </div>

      <DocumentViewerModal
        open={isViewerModalOpen}
        onOpenChange={setIsViewerModalOpen}
        document={toDocumentViewer(selectedDocument)}
      />

      <DocumentApprovalModal
        documentId={selectedDocument?._id}
        isOpen={isApprovalModalOpen}
        onClose={handleCloseApprovalModal}
      />

      <DialogDeleteDocument
        isOpen={!!deleteId}
        id={deleteId ?? ""}
        name={""}
        onClose={handleRemoveDeleteQuestionId}
        setIsSuccess={setIsSuccess}
        setHasError={setHasError}
        setErrorMessage={setErrorMessage}
      />

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao excluir documento!"
          description={errorMessage}
        />
      )}

      {isSuccess && (
        <Toast
          onClose={() => setIsSuccess(false)}
          variant="successSolid"
          title="Documento excluído com sucesso!"
          description="O documento foi excluído com sucesso."
        />
      )}
    </div>
  )
}

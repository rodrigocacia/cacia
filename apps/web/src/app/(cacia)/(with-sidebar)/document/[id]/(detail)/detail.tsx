"use client"

import { CardDocument } from "../components/card-document"
import { Form } from "../new/form"
import { Painel, Vazio } from "@/components/tables/ficha"
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
    <div>
      <Painel
        titulo="Arquivos"
        contagem={documents?.length ?? 0}
        acao={<Form />}
        semPreenchimento
      >
        {documents?.length === 0 ? (
          <Vazio>Nenhum documento nesta pasta ainda.</Vazio>
        ) : (
          <ul className="flex flex-col">
            {documents?.map((document) => (
              <CardDocument
                key={document?._id}
                document={document}
                handleOpenDialog={handleOpenDialog}
                handleAddDeleteDocumentId={handleAddDeleteQuestionId}
                isSystemFolder={isSystemFolder}
              />
            ))}
          </ul>
        )}
      </Painel>

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

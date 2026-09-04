"use client"
import { useState, useCallback } from "react"
import {
  DocumentViewerModal,
  DocumentViewer,
} from "@/components/ui/document-viewer-modal"
import { DocumentApprovalModal } from "@/components/document/document-approval-modal"
import { DialogDeleteFolderDocument } from "@/components/ui/dialog-delete-folder-document"
import { Toast } from "@/components/ui/toast"
import { CardDocument } from "./card-document"
import { Folder } from "@/types/folder"
import { EmptySearch } from "@/components/empty-search"
import { DocumentType, DocumentStatus } from "@/types/document"
import { useRouter } from "next/navigation"

interface ClientDocumentGridProps {
  folders: Folder[]
}

function toDocumentViewer(folder: Folder | null): DocumentViewer | null {
  if (!folder) return null
  return {
    _id: folder._id,
    title: folder.title,
    extension: folder.extension ?? "",
    content_url: folder.content_url ?? "",
    updated_at: folder.updated_at ?? "",
    type: folder.type ?? "",
    lead: folder.lead
      ? {
          _id: folder.lead._id,
          name: folder.lead.name,
          remotejid: "",
          email: "",
        }
      : undefined,
    customer: folder.customer
      ? {
          _id: folder.customer._id,
          name: folder.customer.name,
          remotejid: "",
          email: "",
        }
      : undefined,
  }
}

export function ClientDocumentGrid({ folders }: ClientDocumentGridProps) {
  const router = useRouter()
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Folder | null>(null)
  const [deleteItemData, setDeleteItemData] = useState<{
    id: string
    title: string
    type: "folder" | "document"
  } | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  const handleItemClick = useCallback((item: Folder) => {
    if (!item.type) {
      window.location.href = `/document/${item._id}`
      return
    }

    if (
      item.type === DocumentType.UPLOAD ||
      item.type === DocumentType.ATTACHMENT
    ) {
      setSelectedDocument(item)
      setIsViewerModalOpen(true)
      return
    }

    if (item.type === DocumentType.CREATE) {
      if (
        item.status === DocumentStatus.APPROVED ||
        item.status === DocumentStatus.SENT
      ) {
        setSelectedDocument(item)
        setIsViewerModalOpen(true)
      } else if (
        item.status === DocumentStatus.PENDING_REVIEW ||
        item.status === DocumentStatus.DRAFT
      ) {
        setSelectedDocument(item)
        setIsApprovalModalOpen(true)
      }
    }
  }, [])

  const handleCloseApprovalModal = useCallback(() => {
    setIsApprovalModalOpen(false)
  }, [])

  const handleDeleteClick = useCallback(
    (id: string, title: string, type: "folder" | "document") => {
      setDeleteItemData({ id, title, type })
      setIsDeleteModalOpen(true)
    },
    []
  )

  const handleDeleteSuccess = useCallback(() => {
    setShowSuccessToast(true)
    const itemType = deleteItemData?.type === "folder" ? "Pasta" : "Documento"
    setToastMessage(`${itemType} excluído com sucesso!`)
    router.refresh()
  }, [deleteItemData?.type, router])

  const handleDeleteError = useCallback((message: string) => {
    setShowErrorToast(true)
    setToastMessage(message)
  }, [])

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false)
    setDeleteItemData(null)
  }, [])

  if (folders.length === 0) {
    return (
      <EmptySearch
        title="Nenhum resultado encontrado!"
        subtitle="Não há pastas que correspondam à pesquisa."
      />
    )
  }

  return (
    <>
      <div className="w-full flex flex-col gap-4 mt-6">
        <div className="grid grid-cols-3 gap-3  max-xl:grid-cols-2 max-lg:grid-cols-1">
          {folders?.map((folder) => (
            <div
              key={folder?._id}
              onClick={() => handleItemClick(folder)}
              style={{ cursor: "pointer" }}
            >
              <CardDocument folder={folder} onDelete={handleDeleteClick} />
            </div>
          ))}
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

      {deleteItemData && (
        <DialogDeleteFolderDocument
          itemId={deleteItemData.id}
          itemTitle={deleteItemData.title}
          itemType={deleteItemData.type}
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onSuccess={handleDeleteSuccess}
          onError={handleDeleteError}
        />
      )}

      {showSuccessToast && (
        <Toast
          variant="success"
          title="Sucesso!"
          description={toastMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      {showErrorToast && (
        <Toast
          variant="error"
          title="Erro!"
          description={toastMessage}
          onClose={() => setShowErrorToast(false)}
        />
      )}
    </>
  )
}

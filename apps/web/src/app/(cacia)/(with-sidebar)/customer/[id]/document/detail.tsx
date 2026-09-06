"use client"

import { Icon } from "@/components/icone"
import { useState, useCallback, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"

import { Customer } from "@/types/customer"
import { DocumentType, DocumentStatus } from "@/types/document"

import { EmptySearch } from "@/components/empty-search"
import {
  DocumentViewerModal,
  DocumentViewer,
} from "@/components/ui/document-viewer-modal"
import { DocumentApprovalModal } from "@/components/document/document-approval-modal"
import { DialogDeleteFolderDocument } from "@/components/ui/dialog-delete-folder-document"
import { Toast } from "@/components/ui/toast"

import { CardDocument } from "./components/card-document"
import { Form } from "../../../document/[id]/new/form"
import { Process } from "@/types/process"
import { CustomSearchFilter } from "@/components/ui/custom-search-filter"
import { DocumentSortSelect } from "../../../document/components/document-sort-select"

interface DocumentDetailProps {
  documents: {
    _id: string
    title: string
    extension: string
    content_url?: string
    type?: DocumentType
    status?: DocumentStatus
    updated_at?: string
    process?: Process
    lead?: {
      _id: string
      name: string
      remotejid: string
      email: string
    }
    customer?: {
      _id: string
      name: string
      remotejid: string
      email: string
    }
  }[]
  customer: Customer
}

function toDocumentViewer(
  document: DocumentDetailProps["documents"][0] | null
): DocumentViewer | null {
  if (!document) return null

  return {
    _id: document._id,
    title: document.title,
    extension: document.extension,
    content_url: document.content_url ?? "",
    updated_at: document.updated_at ?? "",
    type: document.type ?? DocumentType.ATTACHMENT,
    lead: document.lead,
    customer: document.customer,
  }
}

export function DocumentDetail({ documents, customer }: DocumentDetailProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const search = searchParams.get("search") || ""

  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<
    DocumentDetailProps["documents"][0] | null
  >(null)
  const [deleteDocumentData, setDeleteDocumentData] = useState<{
    id: string
    title: string
  } | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  const sortBy = searchParams.get("sortBy") || "newest"
  const filteredDocuments = useMemo(() => {
    let filtered = documents

    if (search.trim()) {
      filtered = filtered.filter((document) =>
        document.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    switch (sortBy) {
      case "name_asc":
        filtered = [...filtered].sort((a, b) =>
          a.title.localeCompare(b.title, "pt-BR")
        )
        break
      case "name_desc":
        filtered = [...filtered].sort((a, b) =>
          b.title.localeCompare(a.title, "pt-BR")
        )
        break
      case "newest":
        filtered = [...filtered].sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
          return dateB - dateA
        })
        break
      case "oldest":
        filtered = [...filtered].sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0

          return dateA - dateB
        })
        break
      default:
        filtered = [...filtered].sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
          return dateB - dateA
        })
    }

    return filtered
  }, [documents, search, sortBy])

  const handleOpenDialog = useCallback(
    (document: DocumentDetailProps["documents"][0]) => {
      if (
        !document.type ||
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
    },
    []
  )

  const handleCloseApprovalModal = useCallback(() => {
    setIsApprovalModalOpen(false)
  }, [])

  const handleDeleteClick = useCallback((documentId: string, title: string) => {
    setDeleteDocumentData({ id: documentId, title })
    setIsDeleteModalOpen(true)
  }, [])

  const handleDeleteSuccess = useCallback(() => {
    setShowSuccessToast(true)
    setToastMessage("Documento excluído com sucesso!")
    router.refresh()
  }, [router])

  const handleDeleteError = useCallback((message: string) => {
    setShowErrorToast(true)
    setToastMessage(message)
  }, [])

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false)
    setDeleteDocumentData(null)
  }, [])

  return (
    <>
      <div className="p-8 pb-4 max-md:p-0 md:rounded-2xl md:shadow-sm">
        <div className="w-full flex items-center gap-3 max-md:hidden">
          <Icon
            icon="mdi:folder-text-outline"
            className="text-[#BDBDBD] w-8 h-8"
          />

          <h3 className="text-[20px] text-[#707070] font-bold">Documentos</h3>
        </div>

        <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

        <div className="flex max-md:mt-4 max-md:flex-col flex-wrap items-center justify-between gap-3">
          <Suspense fallback="Carregando...">
            <CustomSearchFilter placeholder="Buscar pelo nome do documento..." />
          </Suspense>

          <DocumentSortSelect />
        </div>

        <div className="w-full flex items-center gap-1 mt-[22px]">
          <Icon icon="mdi:file-document" className="text-[#BDBDBD] w-5 h-5" />

          <h2 className="text-sm text-[#3D3D3D] font-bold">
            {search
              ? `Resultados da busca (${filteredDocuments?.length})`
              : `Todos os arquivos (${filteredDocuments?.length})`}
          </h2>
        </div>

        <div className="w-full mt-6 flex flex-col justify-between gap-8">
          <div className="w-full flex flex-col gap-4">
            {filteredDocuments?.length === 0 ? (
              <EmptySearch
                title={
                  search
                    ? "Nenhum documento encontrado"
                    : "Sem documentos cadastrados"
                }
                subtitle={search ? `Nenhum resultado para "${search}"` : ""}
              />
            ) : null}

            {filteredDocuments?.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 max-[1600px]:grid-cols-1">
                {filteredDocuments?.map((document) => (
                  <CardDocument
                    key={document?._id}
                    document={document}
                    customer={customer}
                    handleOpenDialog={handleOpenDialog}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="w-full flex items-center justify-end max-md:flex-col max-md:gap-4">
            <Form location="customer" customerId={customer?._id} />
          </div>
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

      {deleteDocumentData && (
        <DialogDeleteFolderDocument
          itemId={deleteDocumentData.id}
          itemTitle={deleteDocumentData.title}
          itemType="document"
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

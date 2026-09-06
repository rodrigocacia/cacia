"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DocumentStatusBadge } from "@/components/ui/document-status-badge"
import { DocumentCategoryBadge } from "@/components/ui/document-category-badge"
import { DocumentPreview } from "./document-preview"
import { DocumentEditor } from "./document-editor"
import { useDocumentStore } from "@/stores/use-document-store"
import { useDocumentOperations } from "@/hooks/use-document-operations"
import { Button } from "@/components/ui/custom-button"
import { Icon } from "@/components/icone"
import { DocumentStatus } from "@/types/document"
import { Toast } from "@/components/ui/toast"
import { formatPhone } from "@/utils/formatters"

interface DocumentApprovalModalProps {
  documentId?: string
  isOpen: boolean
  onClose: () => void
}

export function DocumentApprovalModal({
  documentId,
  isOpen,
  onClose,
}: DocumentApprovalModalProps) {
  const {
    currentDocument,
    isLoading,
    error,
    isEditing,
    setIsEditing,
    resetStore,
  } = useDocumentStore()

  const {
    isSubmitting,
    loadDocument,
    updateDocumentContentAction,
    approveDocumentAction,
  } = useDocumentOperations()

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  useEffect(() => {
    if (isOpen && documentId) {
      loadDocument(documentId)
    }
  }, [isOpen, documentId, loadDocument])

  useEffect(() => {
    if (!isOpen) {
      resetStore()
      setShowConfirmDialog(false)
      setShowSuccessToast(false)
    }
  }, [isOpen, resetStore])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleSaveContent = async (content: string) => {
    if (!currentDocument) {
      console.error("Documento não encontrado")
      return
    }

    if (!currentDocument._id) {
      console.error("ID do documento não encontrado:", currentDocument)
      return
    }

    const result = await updateDocumentContentAction(
      currentDocument._id,
      content
    )
    if (result) {
      setIsEditing(false)
    }
  }

  const handleApprove = () => {
    setShowConfirmDialog(true)
  }

  const confirmApproval = async () => {
    if (!currentDocument) {
      console.error("Documento não encontrado")
      return
    }

    if (!currentDocument._id) {
      console.error("ID do documento não encontrado:", currentDocument)
      return
    }

    const result = await approveDocumentAction(currentDocument._id)
    if (result) {
      setShowConfirmDialog(false)
      setIsEditing(false)
      setShowSuccessToast(true)
    }
  }

  const cancelApproval = () => {
    setShowConfirmDialog(false)
  }

  const downloadPdf = () => {
    if (!currentDocument?.content_url) {
      console.error("URL do documento não encontrado")
      return
    }

    const link = document.createElement("a")
    link.href = currentDocument.content_url
    link.download = `${currentDocument.title}.pdf`
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getSuccessMessage = () => {
    if (currentDocument?.customer) {
      return {
        title: "Documento aprovado e enviado!",
        description: `O documento foi aprovado e enviado para o cliente ${currentDocument.customer.name}.`,
      }
    }

    return {
      title: "Documento aprovado e enviado!",
      description: "O documento foi aprovado e enviado para o lead.",
    }
  }

  if (!isOpen) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!w-[96vw] !max-w-[96vw] md:!w-[1024px] md:!max-w-[1024px] max-h-[94vh] md:max-h-[90vh] overflow-hidden p-2 max-md:p-4 flex flex-col">
          {isLoading ? (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle>Carregando documento...</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Icon
                    icon="mdi:loading"
                    className="size-8 animate-spin mx-auto mb-4"
                  />
                  <p>Carregando documento...</p>
                </div>
              </div>
            </>
          ) : error ? (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle>Erro ao carregar documento</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center h-96">
                <div className="text-center text-red-600">
                  <Icon
                    icon="mdi:alert-circle"
                    className="size-8 mx-auto mb-4"
                  />
                  <p>{error}</p>
                </div>
              </div>
            </>
          ) : currentDocument ? (
            <>
              <DialogHeader className="px-4 pt-2 flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-[2rem] mb-4 text-[#3D3D3D]">
                      {currentDocument.title}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-3">
                      <DocumentCategoryBadge
                        category={currentDocument.category}
                      />
                      <DocumentStatusBadge status={currentDocument.status} />
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-3 overflow-y-auto max-md:p-0 flex-1 min-h-0">
                {isEditing ? (
                  <DocumentEditor
                    content={currentDocument.content || ""}
                    onSave={handleSaveContent}
                    onCancel={handleCancelEdit}
                    isSubmitting={isSubmitting}
                  />
                ) : (
                  <div className="space-y-3">
                    <DocumentPreview
                      document={currentDocument}
                      onEdit={
                        currentDocument.status !== DocumentStatus.APPROVED
                          ? handleEdit
                          : undefined
                      }
                      onDownloadPdf={
                        currentDocument.status === DocumentStatus.APPROVED
                          ? downloadPdf
                          : undefined
                      }
                    />

                    {currentDocument.status !== DocumentStatus.APPROVED && (
                      <div className="flex justify-between py-4 max-md:flex-col max-md:items-center">
                        <div className="text-lg max-md:text-sm text-gray-600 p-4 max-md:w-full max-md:text-center">
                          Após aprovado, será <b>AUTOMATICAMENTE ENVIADO</b>{" "}
                          para:{" "}
                          <b>
                            {currentDocument.lead?.name ||
                              currentDocument.customer?.name}
                          </b>{" "}
                          {currentDocument.lead?.remotejid
                            ? `(${formatPhone(currentDocument.lead?.remotejid || "")})`
                            : `(${formatPhone(currentDocument.customer?.remotejid || "")})`}
                          .
                        </div>
                        <Button
                          onClick={handleApprove}
                          className="cursor-pointer bg-green-600 hover:bg-green-700"
                          iconLeft={
                            <Icon icon="mdi:check" className="size-4" />
                          }
                          disabled={isSubmitting}
                        >
                          <span className="">Aprovar e enviar</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle>Documento</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center h-96">
                <div className="text-center text-gray-500">
                  <Icon
                    icon="mdi:file-document-outline"
                    className="size-8 mx-auto mb-4"
                  />
                  <p>Nenhum documento encontrado</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {showConfirmDialog && (
        <Dialog open={true} onOpenChange={cancelApproval}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Aprovar Documento
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-6">
                Tem certeza que deseja <b>APROVAR</b> este documento{" "}
                <b>e envia-lo automaticamente</b> para:{" "}
                <b>
                  {currentDocument?.lead?.name ||
                    currentDocument?.customer?.name}
                </b>{" "}
                {currentDocument?.lead?.remotejid
                  ? `(${formatPhone(currentDocument?.lead?.remotejid || "")})`
                  : `(${formatPhone(currentDocument?.customer?.remotejid || "")})`}
                .
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={cancelApproval}
                  disabled={isSubmitting}
                  className="cursor-pointer flex w-fit px-[30px] py-3 items-center gap-2 rounded-full border border-[#CDEDF0] bg-white text-[#2C8B94] shadow-sm hover:bg-[#f7fdfd] transition-colors"
                >
                  <span className="text-base font-medium">cancelar</span>
                </button>
                <Button
                  onClick={confirmApproval}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                  iconLeft={<Icon icon="mdi:check" className="size-4" />}
                >
                  {isSubmitting ? "Aprovando..." : "Aprovar e enviar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showSuccessToast && (
        <Toast
          variant="successSolid"
          title={getSuccessMessage().title}
          description={getSuccessMessage().description}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </>
  )
}

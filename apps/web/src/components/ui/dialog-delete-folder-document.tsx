"use client"

import { useState } from "react"
import { Button } from "./custom-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"
import { Icon } from "@/components/icone"
import { deleteFolder } from "@/http/folder/delete-folder"
import { deleteDocument } from "@/http/document/delete-document"

interface DialogDeleteFolderDocumentProps {
  itemId: string
  itemTitle: string
  itemType: "folder" | "document"
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export function DialogDeleteFolderDocument({
  itemId,
  itemTitle,
  itemType,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: DialogDeleteFolderDocumentProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsLoading(true)

    try {
      const result =
        itemType === "folder"
          ? await deleteFolder(itemId)
          : await deleteDocument(itemId)

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        onError(
          typeof result.error === "string"
            ? result.error
            : `Erro ao excluir ${itemType === "folder" ? "pasta" : "documento"}`
        )
      }
    } catch (error) {
      onError(
        `Erro inesperado ao excluir ${itemType === "folder" ? "pasta" : "documento"}`
      )
      console.error("Erro inesperado:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const itemTypeLabel = itemType === "folder" ? "pasta" : "documento"
  const warningText =
    itemType === "folder"
      ? "Caso prossiga com esta solicitação, a pasta e todos os documentos dentro dela serão removidos e essa ação não poderá ser desfeita."
      : "Caso prossiga com esta solicitação, o documento será removido e essa ação não poderá ser desfeita."

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="px-[30px]">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Deseja mesmo excluir o {itemTypeLabel}?
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col items-center"
          >
            <div className="w-[100px] h-[100px] flex items-center justify-center rounded-full bg-[#F6F6F9]">
              <Icon
                icon="mdi:help-circle"
                className="w-[56px] h-[56px] text-[#BDBDBD]"
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-3.5 mt-[30px]">
              <h4 className="text-xl text-center text-[#33454C] font-semibold">
                Deseja mesmo excluir{" "}
                {itemType === "folder" ? "a pasta" : "o documento"} {itemTitle}?
              </h4>

              <p className="text-[18px] leading-[24px] text-[#4D5D63] text-center">
                {warningText}
              </p>
            </div>

            <div className="w-full flex items-center justify-center gap-3.5 mt-[34px]">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                isLoading={isLoading}
                disabled={isLoading}
                variant="danger"
              >
                {isLoading ? "Excluindo..." : "Excluir mesmo assim"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

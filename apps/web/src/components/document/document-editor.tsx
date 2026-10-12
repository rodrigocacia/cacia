"use client"

import { useState, useEffect, useCallback } from "react"
import { RichTextEditor } from "./rich-text-editor"
import { Icon } from "@/components/icone"
import { Button } from "@/components/ui/custom-button"

interface DocumentEditorProps {
  content: string
  onSave: (content: string) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function DocumentEditor({
  content,
  onSave,
  onCancel,
  isSubmitting = false,
}: DocumentEditorProps) {
  const [editedContent, setEditedContent] = useState(content)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setEditedContent(content)
  }, [content])

  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      const isSmallScreen = window.innerWidth <= 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const handleSave = useCallback(() => {
    onSave(editedContent)
  }, [onSave, editedContent])

  const handleContentChange = useCallback((newContent: string) => {
    setEditedContent(newContent)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14.5px] font-semibold text-tinta">
          Editar Documento
        </h3>
        <div className="flex items-center gap-2 text-[13px] text-tinta-3">
          <Icon icon="mdi:information-outline" className="size-4" />
          <span>Use a barra de ferramentas para formatar o texto</span>
        </div>
      </div>

      <RichTextEditor
        content={editedContent}
        onChange={handleContentChange}
        placeholder="Digite o conteúdo do documento..."
        className="w-full"
        noInternalScroll={isMobile}
      />

      <div className="flex justify-end gap-3 py-4 max-md:flex-col max-md:items-center">
        <button
          onClick={onCancel}
          className="flex h-9 w-fit cursor-pointer items-center gap-2 rounded-[9px] border border-filete-forte bg-white px-3.5 text-tinta transition-colors hover:bg-gray-100 disabled:opacity-60"
        >
          <span className="text-[13.5px] font-medium">Cancelar</span>
        </button>
        <Button
          onClick={handleSave}
          className="h-10! cursor-pointer px-4 text-[13.5px]"
          iconLeft={<Icon icon="mdi:check" className="size-4" />}
          disabled={isSubmitting}
        >
          <span>{isSubmitting ? "Salvando..." : "Salvar Alterações"}</span>
        </Button>
      </div>
    </div>
  )
}

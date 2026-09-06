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
        <h3 className="font-semibold text-lg text-[#3D3D3D]">
          Editar Documento
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
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
          className="cursor-pointer flex w-fit px-[30px] py-3 items-center gap-2 rounded-full border border-[#CDEDF0] bg-white text-[#2C8B94] shadow-sm hover:bg-[#f7fdfd] transition-colors"
        >
          <span className="text-base font-medium">cancelar</span>
        </button>
        <Button
          onClick={handleSave}
          className="cursor-pointer max-md:rounded-full max-md:flex max-md:justify-center max-md:items-center"
          iconLeft={<Icon icon="mdi:check" className="size-4" />}
          disabled={isSubmitting}
        >
          <span>{isSubmitting ? "Salvando..." : "Salvar Alterações"}</span>
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useState, useCallback } from "react"
import { useDocumentStore } from "@/stores/use-document-store"
import { getDocument } from "@/http/document/get-document"
import {
  updateDocument,
  approveDocument,
} from "@/http/document/update-document"

export function useDocumentOperations() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setCurrentDocument, setIsLoading, setError, updateDocumentContent } =
    useDocumentStore()

  const loadDocument = useCallback(
    async (id: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getDocument(id)

        if (result.success) {
          setCurrentDocument(result.data ?? null)
        } else {
          setError(result.error ?? null)
        }
      } catch (error) {
        setError(`Erro ao carregar documento, error: ${error}`)
      } finally {
        setIsLoading(false)
      }
    },
    [setCurrentDocument, setIsLoading, setError]
  )

  const updateDocumentContentAction = useCallback(
    async (id: string, content: string) => {
      setIsSubmitting(true)
      setError(null)

      try {
        const result = await updateDocument({
          _id: id,
          content,
        })

        if (result.success) {
          updateDocumentContent(content)
          return result.data
        } else {
          setError(result.error ?? null)
          return null
        }
      } catch (error) {
        setError(`Erro ao atualizar documento, error: ${error}`)
        return null
      } finally {
        setIsSubmitting(false)
      }
    },
    [updateDocumentContent, setError]
  )

  const approveDocumentAction = useCallback(
    async (id: string) => {
      setIsSubmitting(true)
      setError(null)

      try {
        const result = await approveDocument(id)

        if (result.success && result.data) {
          setCurrentDocument(result.data)
          return result.data
        } else {
          setError(result.error ?? null)
          return null
        }
      } catch (error) {
        setError(`Erro ao aprovar documento, error: ${error}`)
        return null
      } finally {
        setIsSubmitting(false)
      }
    },
    [setCurrentDocument, setError]
  )

  return {
    isSubmitting,
    loadDocument,
    updateDocumentContentAction,
    approveDocumentAction,
  }
}

import { create } from "zustand"
import { Document, DocumentStatus } from "@/types/document"

interface DocumentStore {
  currentDocument: Document | null
  isLoading: boolean
  error: string | null
  isModalOpen: boolean
  isEditing: boolean

  setCurrentDocument: (document: Document | null) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setIsModalOpen: (open: boolean) => void
  setIsEditing: (editing: boolean) => void
  updateDocumentContent: (content: string) => void
  updateDocumentStatus: (status: DocumentStatus) => void
  resetStore: () => void
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  currentDocument: null,
  isLoading: false,
  error: null,
  isModalOpen: false,
  isEditing: false,

  setCurrentDocument: (document) => set({ currentDocument: document }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setIsModalOpen: (open) =>
    set({
      isModalOpen: open,
      isEditing: false,
    }),

  setIsEditing: (editing) => set({ isEditing: editing }),

  updateDocumentContent: (content) =>
    set((state) => ({
      currentDocument: state.currentDocument
        ? { ...state.currentDocument, content }
        : null,
    })),

  updateDocumentStatus: (status) =>
    set((state) => ({
      currentDocument: state.currentDocument
        ? { ...state.currentDocument, status }
        : null,
    })),

  resetStore: () =>
    set({
      currentDocument: null,
      isLoading: false,
      error: null,
      isModalOpen: false,
      isEditing: false,
    }),
}))

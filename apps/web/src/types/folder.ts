import { DocumentStatus, DocumentCategory } from "./document"

export interface Folder {
  _id: string
  office: string
  title: string
  documents: []
  system?: boolean
  lead?: {
    _id: string
    name: string
  }
  customer?: {
    _id: string
    name: string
  }
  process?: {
    _id: string
    number: string
    name: string
  }
  type?: string
  extension?: string
  content_url?: string
  status?: DocumentStatus
  category?: DocumentCategory
  deleted_at: string | null
  created_at: string
  updated_at: string
  __v: number
}

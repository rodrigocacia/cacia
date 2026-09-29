"use server"

import { api } from "../api-client"

import { DocumentStatus, DocumentType } from "@/types/document"

/** Como a listagem chega depois do adaptador (snake_case, com `_id`). */
export interface DocumentoDaLista {
  _id: string
  title: string
  extension: string
  content_url?: string
  type?: DocumentType
  status?: DocumentStatus
  updated_at?: string
  created_at?: string
  customer_id?: string | null
  process_id?: string | null
}

interface Filtros {
  customerId?: string
  processId?: string
  folderId?: string
}

/**
 * Documentos de um cliente, de um processo ou de uma pasta.
 *
 * As abas de documentos liam `customer.documents` e `process.documents`, que
 * o detalhe da API não traz — o sistema anterior embutia as listas. Sem esta
 * busca, as abas quebravam com "filtered is not iterable".
 */
export async function getDocuments(
  filtros: Filtros
): Promise<DocumentoDaLista[]> {
  const query = new URLSearchParams({ limit: "100" })

  if (filtros.customerId) query.set("customerId", filtros.customerId)
  if (filtros.processId) query.set("processId", filtros.processId)
  if (filtros.folderId) query.set("folderId", filtros.folderId)

  const resultado = await api
    .get(`documents?${query.toString()}`, {
      next: { tags: ["documents"], revalidate: 60 },
    })
    .json<{
      data: Array<
        Omit<DocumentoDaLista, "extension"> & {
          extension?: string | null
        }
      >
    }>()

  return (resultado.data ?? []).map((documento) => ({
    ...documento,
    extension: documento.extension ?? "",
  }))
}

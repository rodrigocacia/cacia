import { apiCrm } from "../api-crm"

/**
 * Conversas do WhatsApp.
 *
 * Os valores dos enums vêm como a API os serializa (nome do membro no Prisma,
 * em maiúsculas).
 */

/**
 * ACTIVE: a IA responde. PENDING: um atendente assumiu e a IA está calada.
 * COMPLETED/CANCELLED: encerrada.
 */
export type StatusDaConversa = "ACTIVE" | "PENDING" | "COMPLETED" | "CANCELLED"

export type Remetente = "LEAD" | "CUSTOMER" | "USER" | "AGENT" | "SYSTEM"

export type StatusDaMensagem =
  "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED"

export interface Mensagem {
  id: string
  sender: Remetente
  type: string
  status: StatusDaMensagem
  messageText: string | null
  messageCaption: string | null
  messageFileUrl: string | null
  messageFileExtension: string | null
  messageFileSizeBytes: number | null
  createdAt: string
}

interface Contato {
  id: string
  name: string
  remotejid: string | null
}

export interface Conversa {
  id: string
  type: "LEAD" | "CUSTOMER"
  status: StatusDaConversa
  userName: string | null
  audioReply: boolean | null
  leadId: string | null
  customerId: string | null
  lastActivityAt: string
  createdAt: string
  customer: Contato | null
  lead:
    | (Contato & {
        stage: { id: string; name: string; color: string } | null
      })
    | null
  /** Só a última, na listagem. */
  messages?: Mensagem[]
}

interface Pagina<T> {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface FiltrosDeConversas {
  status?: StatusDaConversa
  search?: string
  leadId?: string
  customerId?: string
  page?: number
  limit?: number
}

export function listarConversas(
  filtros: FiltrosDeConversas = {}
): Promise<Pagina<Conversa>> {
  const query = new URLSearchParams()

  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== "") query.set(chave, String(valor))
  }

  return apiCrm.get("chats", { searchParams: query }).json<Pagina<Conversa>>()
}

export function detalharConversa(id: string): Promise<Conversa> {
  return apiCrm.get(`chats/${id}`).json<Conversa>()
}

/** Da mais nova para a mais antiga, como a API devolve. */
export function listarMensagens(
  id: string,
  page: number,
  limit: number
): Promise<Pagina<Mensagem>> {
  return apiCrm
    .get(`chats/${id}/messages`, { searchParams: { page, limit } })
    .json<Pagina<Mensagem>>()
}

export function enviarMensagem(id: string, text: string): Promise<Mensagem> {
  return apiCrm.post(`chats/${id}/messages`, { json: { text } }).json()
}

/**
 * Arquivo, imagem ou áudio gravado. O texto da caixa vai como legenda.
 *
 * Sem `Content-Type` manual: o navegador monta o multipart com o boundary.
 */
export function enviarAnexo(
  id: string,
  arquivo: Blob,
  nome: string,
  legenda?: string
): Promise<Mensagem> {
  const formulario = new FormData()
  formulario.append("file", arquivo, nome)
  if (legenda) formulario.append("caption", legenda)

  return apiCrm
    .post(`chats/${id}/attachments`, { body: formulario, timeout: 60_000 })
    .json()
}

export function assumirConversa(id: string): Promise<Conversa> {
  return apiCrm.post(`chats/${id}/take-over`).json()
}

export function devolverParaIa(id: string): Promise<Conversa> {
  return apiCrm.post(`chats/${id}/release`).json()
}

export function encerrarConversa(id: string): Promise<Conversa> {
  return apiCrm.post(`chats/${id}/close`).json()
}

/** Nome para exibir: o cadastro vence o nome do perfil do WhatsApp. */
export function nomeDoContato(conversa: Conversa): string {
  return (
    conversa.customer?.name ??
    conversa.lead?.name ??
    conversa.userName ??
    "Contato sem nome"
  )
}

export function telefoneDoContato(conversa: Conversa): string | null {
  return conversa.customer?.remotejid ?? conversa.lead?.remotejid ?? null
}

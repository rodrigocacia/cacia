import { apiCrm } from "../api-crm"
import type { Importacao, Pagina } from "./tipos"

/**
 * Envia o arquivo e recebe a PRÉVIA — nada é gravado como lead ainda.
 *
 * O que volta é o que o servidor entendeu do arquivo: colunas, amostra e o
 * palpite de mapeamento. A escrita só acontece na confirmação.
 */
export function enviarPlanilha(arquivo: File): Promise<Importacao> {
  const formulario = new FormData()
  formulario.append("file", arquivo)

  // Sem `json:` e sem content-type manual: o navegador precisa montar o
  // boundary do multipart, e defini-lo à mão quebra o parse no servidor.
  return apiCrm.post("lead-imports", { body: formulario }).json<Importacao>()
}

export function confirmarImportacao(
  id: string,
  dados: {
    mapping: Record<string, string>
    stageId?: string
    tagIds?: string[]
  }
): Promise<Importacao> {
  return apiCrm
    .post(`lead-imports/${id}/confirm`, { json: dados })
    .json<Importacao>()
}

export function detalharImportacao(id: string): Promise<Importacao> {
  return apiCrm.get(`lead-imports/${id}`).json<Importacao>()
}

export function listarImportacoes(pagina = 1): Promise<Pagina<Importacao>> {
  return apiCrm
    .get("lead-imports", { searchParams: { page: String(pagina) } })
    .json<Pagina<Importacao>>()
}

export function cancelarImportacao(id: string): Promise<Importacao> {
  return apiCrm.post(`lead-imports/${id}/cancel`).json<Importacao>()
}

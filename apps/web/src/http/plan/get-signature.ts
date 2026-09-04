/**
 * Assinatura e cobrança — NÃO REIMPLEMENTADAS.
 *
 * O sistema anterior cobrava por PIX através da iopay. A reconstrução não
 * trouxe a integração de pagamento: não há gateway configurado, nem rota na
 * API, nem decisão tomada sobre qual provedor usar.
 *
 * Estas funções devolvem uma falha explícita em vez de chamarem um endpoint
 * que não existe. A alternativa seria um 404 disfarçado de erro de rede, que é
 * mais difícil de diagnosticar do que uma mensagem dizendo o que aconteceu.
 *
 * Ver docs/ESTADO.md — "Cobrança".
 */

export interface GetSignatureResponse {
  data: null
  disponivel: false
}

export async function getSignature(): Promise<GetSignatureResponse> {
  return { data: null, disponivel: false }
}

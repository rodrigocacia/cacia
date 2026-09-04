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

export interface CriarAssinaturaResultado {
  success: false
  error: string
}

export async function createSignature(): Promise<CriarAssinaturaResultado> {
  return {
    success: false,
    error: "A cobrança ainda não foi reimplementada nesta versão do sistema.",
  }
}

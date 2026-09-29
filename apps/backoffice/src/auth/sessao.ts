/**
 * Cookies que compõem a sessão do painel.
 *
 * Todos são httpOnly — gravados pelo login no servidor —, então o navegador
 * não consegue apagá-los: o `deleteCookie` que o "Sair" usava no cliente não
 * tinha efeito, e o operador continuava logado. Sair precisa passar pelo
 * servidor e apagar esta lista inteira.
 *
 * `office_id` não é mais gravado, mas sessões antigas ainda podem tê-lo.
 */
export const COOKIES_DA_SESSAO = [
  'token:backoffice',
  'userData',
  'office_id',
] as const;

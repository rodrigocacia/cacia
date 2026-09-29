import { NextRequest, NextResponse } from 'next/server';

import { COOKIES_DA_SESSAO } from '@/auth/sessao';

/**
 * Saída por link direto (GET). A interface usa `sairAction`; esta rota fica
 * para quem chega por URL, e apaga os mesmos cookies — antes deixava
 * `userData` para trás.
 */
export async function GET(request: NextRequest) {
  const resposta = NextResponse.redirect(new URL('/signin', request.url));

  for (const nome of COOKIES_DA_SESSAO) {
    resposta.cookies.delete(nome);
  }

  return resposta;
}

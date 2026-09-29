'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { COOKIES_DA_SESSAO } from './sessao';

/** Único caminho do "Sair" — ver COOKIES_DA_SESSAO. */
export async function sairAction() {
  const cookieStore = await cookies();

  for (const nome of COOKIES_DA_SESSAO) {
    cookieStore.delete(nome);
  }

  redirect('/signin');
}

import { cookies } from 'next/headers';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userData = cookieStore.get('userData')?.value;

  if (!userData) return null;

  return JSON.parse(userData);
}

/**
 * Removida: o painel administrativo não opera dentro de um escritório.
 *
 * Ela lia o cookie `_id`, enquanto o cliente HTTP procurava `office_id` — dois
 * nomes diferentes para a mesma coisa, e nenhum dos dois era gravado no login
 * do painel. Hoje as rotas administrativas atravessam escritórios e o portão
 * delas é o papel global do usuário, não um cabeçalho de tenant.
 */

export async function isAuthenticated() {
  const cookieStore = await cookies();
  return !!cookieStore.get('token:backoffice')?.value;
}

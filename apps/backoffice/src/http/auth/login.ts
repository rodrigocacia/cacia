import ky from 'ky';

/**
 * Login do painel administrativo.
 *
 * Usa `ky` direto, e não o cliente da aplicação: o `api` redireciona para
 * /signin ao receber 401, o que aqui engoliria a mensagem de "e-mail ou senha
 * incorretos" e devolveria o usuário para a mesma tela sem explicação.
 *
 * Como não passa pelo cliente, também não passa pela tradução automática de
 * campos — por isso o mapeamento explícito no fim.
 */

interface SignInRequest {
  email: string;
  password: string;
}

/** O que a API devolve. */
interface RespostaDaApi {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  offices: {
    id: string;
    name: string;
    role: string;
  }[];
}

export interface SignInResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    name: string;
    avatar: string | null;
  };
}

export async function signIn({
  email,
  password,
}: SignInRequest): Promise<SignInResponse> {
  const resultado = await ky
    .post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      json: { email, password },
    })
    .json<RespostaDaApi>();

  return {
    token: resultado.token,
    user: {
      _id: resultado.user.id,
      email: resultado.user.email,
      name: resultado.user.name,
      avatar: resultado.user.avatar,
    },
  };
}

/**
 * Papel global de quem acabou de entrar.
 *
 * O login da API vale para qualquer conta — é o mesmo do painel dos
 * escritórios. Quem decide se a pessoa pode usar o backoffice é o `role` de
 * `users/me`, consultado com o token recém-emitido, antes de gravar a sessão.
 * Também usa `ky` direto: o cookie ainda não existe, e o cliente da aplicação
 * lê o token dele.
 */
export async function buscarPapel(token: string): Promise<string> {
  const perfil = await ky
    .get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .json<{ role: string }>();

  return perfil.role;
}

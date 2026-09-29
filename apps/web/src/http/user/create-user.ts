/* eslint-disable @typescript-eslint/no-explicit-any */
import ky, { HTTPError } from "ky"

import { signIn } from "../auth/login"

/**
 * Cadastro: conta e escritório.
 *
 * O sistema anterior fazia os dois num `POST /offices` público. Na API nova
 * são duas etapas — `POST /auth/register` cria a conta e devolve o token, e
 * `POST /offices`, já autenticado, cria o escritório com o usuário como ADMIN.
 *
 * Usa `ky` direto, como o login: o cliente `api` redireciona para /signin ao
 * receber 401 e injeta o token do cookie, que aqui ainda não existe — ou,
 * pior, é o de outra sessão aberta no mesmo navegador.
 */

interface Address {
  street: string
  number: string
  cep: string
  city: string
  state: string
  neighborhood: string
  complement: string
}

export interface CreateUserRequest {
  user_name: string
  user_email: string
  user_password: string
  user_phone: string
  description: string
  document: string
  oab_number: string
  oab_uf: string
  legal_name: string
  trade_name: string
  name: string
  remotejid: string
  address?: Address
  plan: string
}

export interface CreateUserResponse {
  _id: string
  name: string
  onboarding: boolean
  token: string
  user: { _id: string; name: string; email: string }
}

interface RespostaDeRegistro {
  token: string
  user: { id: string; name: string; email: string }
}

interface EscritorioCriado {
  id: string
  name: string
  onboarding: boolean
}

const API = process.env.NEXT_PUBLIC_API_URL

/**
 * Cria a conta ou, se o e-mail já existir, entra nela.
 *
 * Um cadastro que criou a conta e falhou no escritório — CNPJ repetido, OAB
 * inválida — deixaria a pessoa sem conseguir tentar de novo: o e-mail já
 * estaria em uso. Se a senha confere e a conta não tem escritório, é a mesma
 * pessoa terminando o que começou.
 */
async function obterConta(
  dados: CreateUserRequest
): Promise<RespostaDeRegistro> {
  try {
    return await ky
      .post(`${API}/auth/register`, {
        json: {
          name: dados.user_name,
          email: dados.user_email,
          password: dados.user_password,
          phone: dados.user_phone || undefined,
          document: dados.document?.replace(/\D/g, "") || undefined,
        },
      })
      .json<RespostaDeRegistro>()
  } catch (err) {
    if (!(err instanceof HTTPError) || err.response.status !== 409) throw err

    const existente = await signIn({
      email: dados.user_email,
      password: dados.user_password,
    }).catch(() => null)

    if (!existente || existente.offices.length > 0) throw err

    return {
      token: existente.token,
      user: {
        id: existente.user._id,
        name: existente.user.name,
        email: existente.user.email,
      },
    }
  }
}

export async function createUser(dados: CreateUserRequest) {
  try {
    const conta = await obterConta(dados)

    const endereco = dados.address
    const temEndereco =
      endereco && Object.values(endereco).some((valor) => valor?.trim())

    const escritorio = await ky
      .post(`${API}/offices`, {
        headers: { Authorization: `Bearer ${conta.token}` },
        json: {
          name: dados.trade_name || dados.name,
          description: dados.description || undefined,
          document: dados.document,
          legalName: dados.legal_name || undefined,
          tradeName: dados.trade_name || undefined,
          oabNumber: dados.oab_number,
          oabUf: dados.oab_uf,
          remotejid: dados.remotejid || undefined,
          addresses: temEndereco ? [endereco] : undefined,
        },
      })
      .json<EscritorioCriado>()

    const data: CreateUserResponse = {
      _id: escritorio.id,
      name: escritorio.name,
      onboarding: escritorio.onboarding,
      token: conta.token,
      user: {
        _id: conta.user.id,
        name: conta.user.name,
        email: conta.user.email,
      },
    }

    return { success: true, data } as const
  } catch (err: any) {
    if (err instanceof HTTPError) {
      const errorBody = await err.response.json().catch(() => ({}))
      return {
        success: false,
        error: errorBody as { message: string | string[] },
      } as const
    }

    console.error("Erro inesperado:", err)
    return {
      success: false,
      error: { message: "Erro interno no servidor" },
    } as const
  }
}

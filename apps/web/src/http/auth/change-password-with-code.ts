import ky, { HTTPError } from "ky"

import { mensagemDeErro } from "@/utils/error-handlers"

interface ChangePasswordWithCodeRequest {
  email: string
  code: string
  password: string
}

async function mensagemDaResposta(erro: unknown): Promise<string> {
  if (erro instanceof HTTPError) {
    const corpo: unknown = await erro.response.json().catch(() => null)
    return mensagemDeErro(corpo)
  }

  console.error("Erro inesperado:", erro)
  return "Erro interno no servidor"
}

/**
 * Confere o código antes de pedir a senha nova.
 *
 * Sem isso, quem digitava o código errado preenchia a senha duas vezes para só
 * então descobrir que o código não servia.
 */
export async function validateRecoveryCode({
  email,
  code,
}: {
  email: string
  code: string
}) {
  try {
    const result = await ky
      .post(`${process.env.NEXT_PUBLIC_API_URL}/auth/validate-code`, {
        json: { email, code },
      })
      .json<{ valid: boolean }>()

    return { success: true as const, valid: result.valid }
  } catch (erro) {
    return {
      success: false as const,
      valid: false,
      error: await mensagemDaResposta(erro),
    }
  }
}

/** A confirmação da senha é conferida na tela; a API recebe só a senha. */
export async function changePasswordWithCode({
  email,
  code,
  password,
}: ChangePasswordWithCodeRequest) {
  try {
    await ky.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
      json: { email, code, password },
    })

    return { success: true as const }
  } catch (erro) {
    return { success: false as const, error: await mensagemDaResposta(erro) }
  }
}

import ky from "ky"

import { UnauthorizedRedirectError } from "@/lib/erros"
import { autenticar } from "./autenticacao"

/**
 * Cliente HTTP das telas de CRM.
 *
 * É o mesmo servidor do `api-client`, com uma diferença deliberada: NÃO passa
 * pelo adaptador de vocabulário legado.
 *
 * O `api-client` traduz toda resposta para `_id` e snake_case porque o
 * frontend nasceu sobre uma API em MongoDB e há ~160 componentes lendo os
 * campos naquele formato. As telas de funil, etiquetas e importação são novas:
 * não têm componente antigo para preservar, e fazê-las falar o dialeto do
 * Mongo espalharia a dívida em vez de contê-la.
 *
 * A fronteira é esta: código velho usa `api`, código novo usa `apiCrm`.
 */
export const apiCrm = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  hooks: {
    beforeRequest: [autenticar],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status !== 401) return response

        if (typeof window !== "undefined") {
          await fetch("/api/auth/reset")
          window.location.href = "/signin"
          return response
        }

        throw new UnauthorizedRedirectError()
      },
    ],
  },
})

/** Corpo de erro da API: `{ statusCode, message }`, mais o que a rota anexar. */
export interface ErroDaApi {
  statusCode?: number
  message?: string | string[]
  [chave: string]: unknown
}

/**
 * Extrai a mensagem legível de uma falha do ky.
 *
 * O `message` pode vir como array — é o formato do ValidationPipe quando mais
 * de um campo é recusado. Mostrar `[object Object]` na tela por causa disso é
 * o tipo de erro que só aparece quando o usuário já errou o formulário.
 */
export async function mensagemDoErro(
  erro: unknown,
  padrao = "Não foi possível concluir a operação"
): Promise<string> {
  const resposta = (erro as { response?: Response })?.response

  if (!resposta) return padrao

  try {
    const corpo = (await resposta.json()) as ErroDaApi

    if (Array.isArray(corpo.message)) return corpo.message.join(". ")
    if (typeof corpo.message === "string") return corpo.message

    return padrao
  } catch {
    return padrao
  }
}

/** Corpo completo do erro, quando a tela precisa de mais que a mensagem. */
export async function corpoDoErro(erro: unknown): Promise<ErroDaApi | null> {
  const resposta = (erro as { response?: Response })?.response

  if (!resposta) return null

  try {
    return (await resposta.json()) as ErroDaApi
  } catch {
    return null
  }
}

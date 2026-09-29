import { UnauthorizedRedirectError } from "@/lib/erros"
import ky from "ky"

import { autenticar } from "./autenticacao"

import { limparCorpo, limparQuery, paginaLegada, paraLegado } from "./adaptador"

/**
 * Cliente HTTP da aplicação.
 *
 * Além de autenticar, ele é a fronteira de tradução entre o vocabulário do
 * frontend (`_id`, `created_at`, `legal_name`) e o da API (`id`, `createdAt`,
 * `legalName`) — ver adaptador.ts. Traduzir aqui evita reescrever os ~160
 * componentes que leem esses campos.
 *
 * O que continua sendo responsabilidade de cada arquivo de `http/` é o
 * CAMINHO: ele é semântico e precisa estar visível em quem chama.
 */

/** Só o corpo JSON é traduzido; envio de arquivo e download passam intactos. */
function ehJson(tipo: string | null): boolean {
  return tipo !== null && tipo.includes("application/json")
}

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  hooks: {
    beforeRequest: [
      // Mesma autenticação do cliente de CRM — ver http/autenticacao.ts
      autenticar,

      /**
       * Ajusta a requisição para o contrato da API.
       *
       * Query e corpo num hook só, montando UMA requisição nova: o ky adota o
       * `Request` devolvido por um hook, e devolver dois em sequência faz o
       * segundo ser construído sobre um corpo já consumido pelo primeiro.
       */
      async (request) => {
        const url = new URL(request.url)
        const queryOriginal = url.search

        limparQuery(url.searchParams)

        const querymudou = url.search !== queryOriginal
        const temCorpoJson = ehJson(request.headers.get("content-type"))

        if (!querymudou && !temCorpoJson) return request

        let corpo: string | undefined

        if (temCorpoJson) {
          const original = (await request.clone().json()) as unknown

          if (typeof original === "object" && original !== null) {
            corpo = JSON.stringify(
              limparCorpo(original as Record<string, unknown>)
            )
          }
        }

        return new Request(url.toString(), {
          method: request.method,
          headers: request.headers,
          body: corpo ?? (temCorpoJson ? await request.clone().text() : null),
          credentials: request.credentials,
          redirect: request.redirect,
          referrer: request.referrer,
        })
      },
    ],

    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            await fetch("/api/auth/reset")
            window.location.href = "/signin"
          } else {
            throw new UnauthorizedRedirectError()
          }
        }

        return response
      },

      /**
       * Traduz a resposta para o formato que os componentes esperam.
       *
       * Não toca em erro: o corpo de erro da API é `{ statusCode, message }` e
       * já é lido assim nos `catch` espalhados pela aplicação.
       */
      async (request, options, response) => {
        if (!response.ok) return response
        if (!ehJson(response.headers.get("content-type"))) return response

        const corpo = (await response.clone().json()) as unknown

        // Lista sem paginação (agents, calendars, connections, reminders) vem
        // como array puro. O frontend sempre leu listas como `{ data: [] }`;
        // embrulhar aqui evita `result.data[0]` explodir em cada consumidor.
        const traduzido = ehPaginada(corpo)
          ? paginaLegada(corpo)
          : Array.isArray(corpo)
            ? paginaLegada({ data: corpo })
            : paraLegado(corpo)

        return new Response(JSON.stringify(traduzido), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        })
      },
    ],
  },
})

/** Resposta de listagem: `{ data: [], meta: {} }`. */
function ehPaginada(corpo: unknown): boolean {
  if (typeof corpo !== "object" || corpo === null) return false

  const possivel = corpo as { data?: unknown; meta?: unknown }

  return Array.isArray(possivel.data) && typeof possivel.meta === "object"
}

import type { BeforeRequestHook } from "ky"

/**
 * Lê um cookie dos dois lados: servidor e navegador.
 *
 * As páginas são Server Components que buscam dados no servidor e hidratam o
 * SWR, então o mesmo cliente HTTP roda nos dois lugares — e o cookie se lê de
 * um jeito em cada um.
 */
async function cookie(nome: string): Promise<string | undefined> {
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers")
    return (await cookies()).get(nome)?.value
  }

  const { getCookie } = await import("cookies-next")
  return getCookie(nome) as string | undefined
}

/**
 * Autenticação e escritório, para qualquer cliente HTTP da aplicação.
 *
 * Extraído do `api-client` para que o cliente do CRM (`api-crm`) use
 * exatamente as mesmas regras sem herdar a tradução de vocabulário legado —
 * duas cópias deste trecho seria como um dos dois deixaria de mandar o
 * cabeçalho do escritório e passaria a receber 400 em toda chamada.
 */
export const autenticar: BeforeRequestHook = async (request) => {
  const token = await cookie("token")

  if (token) {
    request.headers.set("Authorization", `Bearer ${token}`)
  }

  // A API resolve o escritório por este cabeçalho — nunca por query ou
  // corpo — e recusa a requisição sem ele nas rotas de escritório.
  const officeId = await cookie("office_id")

  if (officeId) {
    request.headers.set("x-office-id", officeId)
  }
}

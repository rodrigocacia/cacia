import { UnauthorizedRedirectError } from "@/lib/erros"
import ky from "ky"

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  hooks: {
    beforeRequest: [
      async (request) => {
        let token: string | undefined

        if (typeof window === "undefined") {
          const { cookies } = await import("next/headers")
          token = (await cookies()).get("token")?.value
        } else {
          const { getCookie } = await import("cookies-next")
          token = getCookie("token") as string | undefined
        }

        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
        }
        // A API nova resolve o escritório por este cabeçalho — nunca por query
        // ou corpo — e recusa a requisição sem ele nas rotas de escritório.
        let officeId: string | undefined

        if (typeof window === "undefined") {
          const { cookies } = await import("next/headers")
          officeId = (await cookies()).get("office_id")?.value
        } else {
          const { getCookie } = await import("cookies-next")
          officeId = getCookie("office_id") as string | undefined
        }

        if (officeId) {
          request.headers.set("x-office-id", officeId)
        }
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
      },
    ],
  },
})

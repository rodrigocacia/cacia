"use server"

import { HTTPError } from "ky"
import { z } from "zod"
import { cookies } from "next/headers"

import { signIn } from "@/http/auth/login"

const signInSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido" }),
  password: z.string().min(6, { message: "Por favor insira sua senha" }),
})

export async function signInAction(data: FormData) {
  const result = signInSchema.safeParse(Object.fromEntries(data))
  const cookieStore = await cookies()

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors

    return { success: false, message: null, errors }
  }

  const { email, password } = result.data

  let onboarding = false

  try {
    const {
      token,
      user: { _id, name },
      offices,
    } = await signIn({
      email,
      password,
    })

    // Conta sem escritório: acontece quando o cadastro parou no meio.
    const escritorio = offices[0]

    if (!escritorio) {
      return {
        success: false,
        message: "Sua conta ainda não está vinculada a um escritório",
        errors: null,
      }
    }

    // A cobrança não foi reimplementada — ver http/plan. O bloqueio por
    // assinatura ficava aqui e travaria TODO login, porque não há como criar
    // uma assinatura neste sistema. Voltará junto com o meio de pagamento.
    onboarding = escritorio.onboarding

    cookieStore.set("token", token, {
      maxAge: 60 * 60 * 23, // 23 horas
      path: "/",
    })

    cookieStore.set("office_id", escritorio._id, {
      maxAge: 60 * 60 * 23, // 23 horas
      path: "/",
    })

    const data = { _id, name, email: email }

    cookieStore.set("userData", JSON.stringify(data), {
      maxAge: 60 * 60 * 23, // 23 horas
      path: "/",
    })

    return {
      success: true,
      message: null,
      errors: null,
      redirectTo: onboarding ? "/" : "/onboard",
    }
  } catch (err) {
    if (err instanceof HTTPError) {
      const errorBody = await err.response.json()

      return {
        success: false,
        message: errorBody.message || "Erro de autenticação",
        errors: null,
      }
    }

    console.error(err)

    return {
      success: false,
      message: "Erro inesperado, tente novamente em alguns segundos",
      errors: null,
    }
  }
}

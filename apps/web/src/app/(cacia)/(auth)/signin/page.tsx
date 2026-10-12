import Link from "next/link"

import { MolduraDeAcesso } from "@/components/acesso/moldura"

import { SignInForm } from "./sign-in-form"
import { SignupForm } from "./signup-form"

interface SignInProps {
  searchParams: Promise<{ signin?: string }>
}

export default async function SignIn({ searchParams }: SignInProps) {
  const { signin } = await searchParams
  const cadastro = signin === "signup"

  return (
    <MolduraDeAcesso
      topo={
        cadastro ? (
          <span>
            Já tem conta?{" "}
            <Link
              href="/signin"
              className="font-semibold text-turquesa-profundo hover:underline"
            >
              Entrar
            </Link>
          </span>
        ) : (
          <span>
            Novo por aqui?{" "}
            <Link
              href="/signin?signin=signup"
              className="font-semibold text-turquesa-profundo hover:underline"
            >
              Criar conta
            </Link>
          </span>
        )
      }
    >
      {cadastro ? <SignupForm /> : <SignInForm />}
    </MolduraDeAcesso>
  )
}

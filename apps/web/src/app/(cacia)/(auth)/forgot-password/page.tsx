import Link from "next/link"

import { MolduraDeAcesso } from "@/components/acesso/moldura"

import { Form } from "./form"

export default function ForgotPassword() {
  return (
    <MolduraDeAcesso
      topo={
        <span>
          Lembrou?{" "}
          <Link
            href="/signin"
            className="font-semibold text-turquesa-profundo hover:underline"
          >
            Entrar
          </Link>
        </span>
      }
    >
      <Form />
    </MolduraDeAcesso>
  )
}

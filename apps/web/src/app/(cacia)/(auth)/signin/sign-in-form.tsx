"use client"

import Link from "next/link"

import { useRouter } from "next/navigation"

import { useFormState } from "@/hooks/use-form-state"
import { signInAction } from "./actions"

import { Button } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { Toast } from "@/components/ui/toast"
import { DialogCheckoutPlan } from "@/components/dialog-checkout-plan"
import { AUTOCOMPLETE_VALUES } from "@/constants/autocomplete"
import { useHidratado } from "@/hooks/use-hidratado"

export function SignInForm() {
  const router = useRouter()
  const hidratado = useHidratado()

  const [
    { errors, message, success },
    handleSubmit,
    isPending,
    resetFormState,
  ] = useFormState(signInAction, (data) => {
    if (data?.redirectTo) {
      router.push(data.redirectTo)
    }
  })

  return (
    <>
      {/* `method="post"` e o botão travado até hidratar: sem os dois, um
          envio antes do React assumir virava GET nativo e a senha ia parar na
          URL — no histórico, nos logs do servidor e no Referer. */}
      <form
        method="post"
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-8"
      >
        <div className="flex flex-col gap-2.5">
          <h2 className="font-display text-[46px] leading-none text-tinta max-lg:text-[34px]">
            Entrar
          </h2>
          <p className="text-[15px] text-tinta-2">
            Bem-vindo de volta ao seu escritório.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            type="email"
            name="email"
            label="E-mail"
            placeholder="voce@escritorio.adv.br"
            iconName={null}
            autoComplete={AUTOCOMPLETE_VALUES.EMAIL}
            error={errors?.email[0]}
          />

          <Input
            type="password"
            name="password"
            label="Senha"
            placeholder="Sua senha"
            iconName={null}
            autoComplete={AUTOCOMPLETE_VALUES.CURRENT_PASSWORD}
            error={errors?.password[0]}
          />

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium text-turquesa-profundo hover:underline"
            >
              Esqueci a senha
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="h-[46px] w-full"
          variant="primary"
          isLoading={isPending}
          disabled={!hidratado || isPending}
        >
          Entrar
        </Button>

        {success === false && message && (
          <Toast
            onClose={resetFormState}
            variant="error"
            title="Erro ao fazer login"
            description={message}
          />
        )}
      </form>

      <DialogCheckoutPlan />
    </>
  )
}

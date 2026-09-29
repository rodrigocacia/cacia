"use client"

import Image from "next/image"
import Link from "next/link"

import { useRouter } from "next/navigation"

import { useFormState } from "@/hooks/use-form-state"
import { signInAction } from "./actions"

import { Button } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { AuthTabs } from "@/components/ui/auth-tabs"
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
        className="bg-white relative z-10 w-full h-full max-lg:h-fit flex flex-col gap-8 shadow-md rounded-4xl max-lg:rounded-t-4xl max-lg:rounded-b-none px-8 pt-[28px] max-lg:pb-4"
      >
        <div className="w-full max-lg:hidden">
          <Image src="/logo-cacia.png" alt="mockup" width={200} height={61} />
        </div>

        <AuthTabs />

        <div className="flex flex-col gap-5">
          <Input
            type="email"
            name="email"
            label="E-mail"
            placeholder="seu@email"
            iconName="mail"
            autoComplete={AUTOCOMPLETE_VALUES.EMAIL}
            error={errors?.email[0]}
          />

          <Input
            type="password"
            name="password"
            label="Senha"
            placeholder="Insira a sua senha de acesso..."
            iconName="lock"
            autoComplete={AUTOCOMPLETE_VALUES.CURRENT_PASSWORD}
            error={errors?.password[0]}
          />

          <div className="flex items-center justify-end">
            <Link href="forgot-password">Esqueci minha senha</Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-[251px] max-lg:w-full cursor-pointer"
          variant="primary"
          iconLeft={
            !isPending ? (
              <Image
                src="/icons/welcome-button.svg"
                alt=""
                width={24}
                height={24}
              />
            ) : null
          }
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

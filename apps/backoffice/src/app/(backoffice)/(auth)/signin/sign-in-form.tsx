"use client";

import Image from "next/image";
import Link from "next/link";

import { useRouter } from "next/navigation";

import { useFormState } from "@/hooks/use-form-state";
import { signInAction } from "./actions";

import { Button } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/custom-input";
import { Toast } from "@/components/ui/toast";

export function SignInForm() {
  const router = useRouter();

  const [
    { errors, message, success },
    handleSubmit,
    isPending,
    resetFormState,
  ] = useFormState(signInAction, () => {
    router.push("/dashboard");
  });

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white relative z-10 w-full h-full max-lg:h-fit flex flex-col gap-8 shadow-md rounded-4xl px-8 pt-[28px] max-lg:pb-4"
    >
      <div className="w-full flex items-center max-lg:hidden">
        <Image src="/logo-cacia.png" alt="mockup" width={200} height={61} />

        <div className="w-px h-12 bg-gray-300 mx-4" />

        <h3 className="text-2xl">Backoffice</h3>
      </div>

      <div className="flex flex-col gap-5">
        <Input
          name="email"
          label="E-mail"
          placeholder="seu@email"
          iconName="mail"
          error={errors?.email[0]}
        />

        <Input
          type="password"
          name="password"
          label="Senha"
          placeholder="Insira a sua senha de acesso..."
          iconName="lock"
          error={errors?.password[0]}
        />

        <div className="flex items-center justify-between">
          <span>
            <input type="checkbox" id="vehicle1" name="vehicle1" value="Bike" />{" "}
            Lembra de mim
          </span>

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
  );
}

"use client";

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
      method="post"
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-8"
    >
      <div className="flex flex-col gap-2.5">
        <span className="rotulo">Backoffice</span>
        <h2 className="font-display text-[46px] leading-none text-tinta max-lg:text-[34px]">
          Entrar
        </h2>
        <p className="text-[15px] text-tinta-2">
          Acesse o painel de administração da CacIA.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          type="email"
          name="email"
          label="E-mail"
          placeholder="voce@cacia.com.br"
          iconName={null}
          autoComplete="email"
          error={errors?.email[0]}
        />

        <Input
          type="password"
          name="password"
          label="Senha"
          placeholder="Sua senha"
          iconName={null}
          autoComplete="current-password"
          error={errors?.password[0]}
        />

        <label
          htmlFor="lembrar"
          className="flex w-fit cursor-pointer items-center gap-2.5 text-[13.5px] text-tinta-2"
        >
          <input
            type="checkbox"
            id="lembrar"
            name="lembrar"
            className="h-4 w-4 cursor-pointer rounded-[5px] border-filete-forte accent-acao"
          />
          Lembrar de mim
        </label>
      </div>

      <Button
        type="submit"
        className="h-[46px] w-full"
        variant="primary"
        isLoading={isPending}
        disabled={isPending}
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

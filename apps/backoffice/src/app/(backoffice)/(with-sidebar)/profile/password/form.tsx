"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/custom-input";
import { Toast } from "@/components/ui/toast";
import { updatePassword } from "@/http/user/update-password";
import { revalidateProfile } from "../actions";

import { z } from "zod";
// Mesmo mínimo da API (TrocarSenhaDto): com 6 aqui, a senha de 6 ou 7
// caracteres passava na tela e voltava recusada do servidor.
export const changePasswordSchema = z
  .object({
    password: z.string().min(1, "Senha atual obrigatória"),
    newPassword: z
      .string()
      .min(8, "A nova senha precisa de ao menos 8 caracteres"),
    confirmNewPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((dados) => dados.newPassword === dados.confirmNewPassword, {
    message: "As senhas não conferem",
    path: ["confirmNewPassword"],
  });
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export function Form() {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit: SubmitHandler<ChangePasswordFormData> = async (data) => {
    try {
      const result = await updatePassword({
        currentPassword: data.password,
        newPassword: data.newPassword,
      });

      if (!result.success) {
        setHasError(true);
        setErrorMessage(result.error || "Erro ao alterar senha");
        return;
      }

      setIsSuccess(true);
      await revalidateProfile();
      reset();
    } catch {
      setHasError(true);
      setErrorMessage("Erro interno no servidor");
    }
  };

  return (
    <section className="w-full rounded-[14px] border border-filete bg-white">
      <header className="flex flex-col gap-1 border-b border-filete px-6 py-4 max-sm:px-4">
        <h2 className="text-[14.5px] font-semibold text-tinta">
          Dados de acesso
        </h2>
        <p className="text-[13px] text-tinta-3">
          Troque a senha usada para entrar no backoffice.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col">
        <div className="flex w-full flex-col gap-4 px-6 py-6 max-sm:px-4">
          <Input
            type="password"
            label="Senha atual"
            aria-label="Senha atual"
            iconName="lock"
            {...register("password")}
            error={errors?.password}
          />

          <div className="flex w-full items-start justify-between gap-6 max-md:flex-col max-md:gap-4">
            <div className="w-full">
              <Input
                type="password"
                label="Nova senha"
                aria-label="Nova senha"
                iconName="lock"
                {...register("newPassword")}
                error={errors?.newPassword}
              />
            </div>

            <div className="w-full">
              <Input
                type="password"
                label="Confirmar nova senha"
                aria-label="Confirmar nova senha"
                iconName="lock"
                {...register("confirmNewPassword")}
                error={errors?.confirmNewPassword}
              />
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-end border-t border-filete px-6 py-4 max-sm:px-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            iconLeft={<Save size={16} strokeWidth={1.7} aria-hidden />}
            isLoading={isSubmitting}
            className="px-6 max-sm:w-full"
            variant="primary"
          >
            Salvar
          </Button>
        </div>
      </form>

      {isSuccess && (
        <Toast
          onClose={() => setIsSuccess(false)}
          variant="successSolid"
          title="Senha atualizada com sucesso!"
          description="Sua senha foi alterada com sucesso!"
        />
      )}

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao alterar senha!"
          description={errorMessage}
        />
      )}
    </section>
  );
}

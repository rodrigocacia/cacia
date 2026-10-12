"use client"

import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/custom-button"
import { Input } from "@/components/ui/custom-input"
import { Toast } from "@/components/ui/toast"
import {
  changePasswordSchema,
  ChangePasswordFormData,
} from "@/schemas/change-password"
import { changePassword } from "@/http/auth/change-password"
import { Check } from "lucide-react"

import { Cartao, RodapeDoCartao } from "../../setting/_ui/cartao"

export function Form() {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit: SubmitHandler<ChangePasswordFormData> = async (data) => {
    try {
      const result = await changePassword({
        password: data.password,
        newPassword: data.newPassword,
      })

      if (!result.success) {
        setHasError(true)
        setErrorMessage(result.error || "Erro ao alterar senha")
        return
      }

      setIsSuccess(true)
      reset()
    } catch {
      setHasError(true)
      setErrorMessage("Erro interno no servidor")
    }
  }

  return (
    <Cartao
      titulo="Dados de acesso"
      descricao="Troque a senha usada para entrar na CacIA."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-7"
      >
        <div className="w-full flex flex-col gap-4">
          <Input
            type="password"
            label="Senha atual"
            aria-label="Senha atual"
            iconName="lock"
            {...register("password")}
            error={errors?.password}
          />

          <div className="grid w-full gap-4 md:grid-cols-2">
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

        <RodapeDoCartao>
          <Button
            type="submit"
            disabled={isSubmitting}
            iconLeft={<Check size={16} />}
            isLoading={isSubmitting}
            className="px-5"
            variant="primary"
          >
            Salvar
          </Button>
        </RodapeDoCartao>
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
    </Cartao>
  )
}

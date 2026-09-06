"use client"

import { useState } from "react"
import { Icon } from "@/components/icone"
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
        confirmNewPassword: data.confirmNewPassword,
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
    <div className="h-full p-8 max-md:p-0 pb-6 md:rounded-2xl md:shadow-sm md:pb-0">
      <div className="flex items-center gap-3">
        <Icon icon="mdi:password-outline" className="w-8 h-8 text-[#BDBDBD]" />

        <h3 className="text-[20px] text-[#707070] font-bold">
          Dados de acesso
        </h3>
      </div>

      <hr className="w-full my-4 max-md:my-2 h-px border-t-0 bg-gray-200" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full mt-6 flex flex-col justify-between gap-8 pb-10"
      >
        <div className="w-full flex flex-col gap-4">
          <Input
            type="password"
            label="Senha Atual"
            aria-label="Senha Atual"
            iconName="lock"
            {...register("password")}
            error={errors?.password}
          />

          <div className="w-full flex gap-6 items-center justify-between max-md:flex-col max-md:gap-4">
            <div className="w-full">
              <Input
                type="password"
                label="Nova Senha"
                aria-label="Nova Senha"
                iconName="lock"
                {...register("newPassword")}
                error={errors?.newPassword}
              />
            </div>

            <div className="w-full">
              <Input
                type="password"
                label="Confirmar Nova Senha"
                aria-label="Confirmar Nova Senha"
                iconName="lock"
                {...register("confirmNewPassword")}
                error={errors?.confirmNewPassword}
              />
            </div>
          </div>
        </div>

        <div className="w-full flex items-center justify-end max-md:flex-col max-md:gap-4 mt-8 max-md:pb-10">
          <Button
            type="submit"
            disabled={isSubmitting}
            iconLeft={
              <Icon icon="mdi:content-save" className="w-6 h-6 text-white" />
            }
            isLoading={isSubmitting}
            className="px-10 cursor-pointer max-md:w-full"
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
    </div>
  )
}

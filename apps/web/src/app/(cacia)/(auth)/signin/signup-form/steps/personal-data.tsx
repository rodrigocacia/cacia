/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import Image from "next/image"

import { motion } from "framer-motion"

import { Controller, useFormContext } from "react-hook-form"

import { Input } from "@/components/ui/custom-input"
import { CustomRadioButton } from "@/components/ui/custom-radio-button"
import { Button } from "@/components/ui/custom-button"

import { IoMdInformationCircle } from "react-icons/io"
import { IoIosCheckmarkCircle } from "react-icons/io"
import { SignupFormData } from "@/schemas/signup"
import { InputPhone } from "@/components/ui/custom-input-phone"
import { AUTOCOMPLETE_VALUES } from "@/constants/autocomplete"
import { validateCpf } from "@/utils/validate-cpf"

interface PersonalDataProps {
  nextStep(): void
}

export function PersonalData({ nextStep }: PersonalDataProps) {
  const {
    register,
    watch,
    control,
    formState: { errors },
    trigger,
    setValue,
    getValues,
    setError,
    setFocus,
    clearErrors,
    getFieldState,
  } = useFormContext<SignupFormData>()

  const passwordValue = watch("user_password") || ""
  const typeDocumentUser = watch("type_document_user")

  const passwordRules = {
    minLength: passwordValue.length >= 8,
    hasNumber: /\d/.test(passwordValue),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue),
    hasUpperAndLower:
      /[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue),
  }

  function focusScrollAndShake(fieldName: keyof SignupFormData) {
    setFocus(fieldName as any, { shouldSelect: true })

    const el = document.querySelector<HTMLElement>(
      `[name="${String(fieldName)}"]`
    )
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.classList.add("shake-on-error")
      setTimeout(() => el.classList.remove("shake-on-error"), 500)
    }
  }

  async function handleNext(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const { type_document_user, user_document } = getValues()

    setValue("type_document", type_document_user)
    setValue("document", user_document)

    const isValidPassword = await trigger(
      ["user_password", "password_confirmation"],
      { shouldFocus: true }
    )
    const { user_password, password_confirmation } = getValues()
    if (isValidPassword && user_password !== password_confirmation) {
      setError("password_confirmation", {
        type: "manual",
        message: "As senhas não coincidem",
      })
      focusScrollAndShake("password_confirmation")
      return
    }

    if (type_document_user === "CPF") {
      const isValidCpf = validateCpf(user_document)
      if (!isValidCpf) {
        setError("user_document", { type: "manual", message: "CPF inválido" })
        focusScrollAndShake("user_document")
        return
      } else {
        clearErrors("user_document")
      }
    }

    const fieldsToValidate: (keyof SignupFormData)[] = [
      "user_name",
      "user_phone",
      "user_email",
      "type_document_user",
      "user_password",
      "password_confirmation",
    ]

    const isValid = await trigger(fieldsToValidate, { shouldFocus: true })

    if (!isValid) {
      const firstInvalid = fieldsToValidate.find(
        (n) => !!getFieldState(n).error
      )
      if (firstInvalid) focusScrollAndShake(firstInvalid)
      return
    }

    nextStep()
  }

  return (
    <form onSubmit={handleNext} className="w-full h-full pb-4">
      <div className="flex flex-col gap-5">
        <h3 className="text-xl font-semibold text-[#3D3D3D]">
          Dados do usuário
        </h3>

        <Input
          {...register("user_name")}
          label="Nome completo"
          placeholder="Digite seu nome completo"
          iconName="person"
          autoComplete="section-signup name"
          inputMode="text"
          autoCapitalize="words"
          spellCheck={false}
          error={errors?.user_name}
        />
        <InputPhone
          control={control}
          {...register("user_phone")}
          label="Telefone (WhatsApp)"
          placeholder="Insira o seu número de telefone..."
          error={errors?.user_phone}
        />
        <div className="flex items-start gap-1.5 p-2.5 bg-[#F8F9FA] border border-[#E9ECEF] rounded-[6px]">
          <IoMdInformationCircle
            size={16}
            className="text-[#348C98] mt-0.5 flex-shrink-0"
          />
          <p className="text-sm text-[#6C757D] leading-relaxed">
            Este número deve ser o telefone pessoal do advogado.
          </p>
        </div>
        <Input
          {...register("user_email")}
          label="E-mail"
          placeholder="Digite seu e-mail"
          iconName="mail"
          autoComplete={AUTOCOMPLETE_VALUES.EMAIL}
          error={errors?.user_email}
        />

        <div>
          <h4 className="text-base text-[#707070] font-semibold">
            Tipo de cadastro
          </h4>

          <div className="flex items-center gap-4 mt-6">
            <Controller
              name="type_document_user"
              control={control}
              defaultValue="CPF"
              render={({ field }) => (
                <>
                  <CustomRadioButton
                    {...field}
                    label="Pessoa física (CPF)"
                    value="CPF"
                    checked={field.value === "CPF"}
                    onChange={(e) => field.onChange(e)}
                  />
                  <CustomRadioButton
                    {...field}
                    label="Pessoa jurídica (CNPJ)"
                    value="CNPJ"
                    checked={field.value === "CNPJ"}
                    onChange={(e) => field.onChange(e)}
                  />
                </>
              )}
            />
          </div>
        </div>

        <Input
          {...register("user_document")}
          label={typeDocumentUser === "CPF" ? "CPF" : "CNPJ"}
          mask={typeDocumentUser === "CPF" ? "cpf" : "cnpj"}
          placeholder={
            typeDocumentUser === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"
          }
          iconName="contact"
          error={errors?.user_document}
        />
      </div>

      <div className="mt-8 flex flex-col gap-5">
        <h3 className="text-xl font-semibold text-[#3D3D3D]">
          Defina uma senha de acesso
        </h3>

        <Input
          type="password"
          {...register("user_password")}
          label="Senha"
          placeholder="Crie sua senha de acesso"
          iconName="lock"
          autoComplete={AUTOCOMPLETE_VALUES.NEW_PASSWORD}
          error={errors?.user_password}
        />

        <Input
          type="password"
          {...register("password_confirmation")}
          label="Repita a senha"
          placeholder="Confirme sua senha"
          iconName="lock"
          autoComplete={AUTOCOMPLETE_VALUES.NEW_PASSWORD}
          error={errors?.password_confirmation}
        />

        <div className="w-full flex flex-col gap-3.5 p-2.5 border border-[#EFEFEF] rounded-[8px]">
          <div className="flex items-center gap-1.5">
            <IoMdInformationCircle
              width={18}
              height={16}
              className="text-[#348C98]"
            />

            <h3 className="text-base text-[#3D3D3D] font-bold">
              Sua senha deve ter:
            </h3>
          </div>

          <hr className="w-full h-px border-t-0 bg-gray-200" />

          <div className="flex flex-col gap-2">
            {[
              { label: "mínimo 8 caracteres", valid: passwordRules.minLength },
              { label: "números", valid: passwordRules.hasNumber },
              {
                label: "letras maiúsculas e minúsculas",
                valid: passwordRules.hasUpperAndLower,
              },
              {
                label: "1 caractere especial",
                valid: passwordRules.hasSpecialChar,
              },
            ].map((rule, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-1"
                initial={{ opacity: 0.5 }}
                animate={{
                  opacity: rule.valid ? 1 : 0.5,
                  scale: rule.valid ? 1.01 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <IoIosCheckmarkCircle
                  size={16}
                  className={rule.valid ? "text-[#16A31B]" : "text-[#EFEFEF]"}
                />
                <h4 className="text-sm font-bold text-[#707070]">
                  {rule.label}
                </h4>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center mt-11">
        <Button
          type="submit"
          className="w-[251px] cursor-pointer"
          variant="primary"
          iconRight={
            <Image src="/icons/arrow-right.svg" alt="" width={24} height={24} />
          }
        >
          Prosseguir
        </Button>
      </div>
    </form>
  )
}

"use client"

import {
  useState,
  useRef,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react"

import Image from "next/image"

import { Send } from "lucide-react"

import { SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Heading } from "@/components/ui/heading"
import { Input } from "@/components/ui/custom-input"
import { Button } from "@/components/ui/custom-button"
import { forgot } from "@/http/auth/forgot"
import {
  changePasswordWithCode,
  validateRecoveryCode,
} from "@/http/auth/change-password-with-code"

import { Toast } from "@/components/ui/toast"
import { useRouter } from "next/navigation"
import { IoMdInformationCircle } from "react-icons/io"
import { IoIosCheckmarkCircle } from "react-icons/io"
import { motion } from "framer-motion"

const createForgotPasswordDataFormSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido" }),
})

export type CreateForgotPasswordDataFormData = z.infer<
  typeof createForgotPasswordDataFormSchema
>

export function Form() {
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isValidatingCode, setIsValidatingCode] = useState(false)
  const [step, setStep] = useState(1)
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""))
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [email, setEmail] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateForgotPasswordDataFormData>({
    resolver: zodResolver(createForgotPasswordDataFormSchema),
  })

  const nextStep = () => {
    if (step === 3) return

    setStep(step + 1)
  }

  const onClose = () => {
    setError(false)
  }

  const onError = (mensagem: string) => {
    setErrorMessage(mensagem)
    setError(true)
  }

  const handleCodeSubmit = async () => {
    setIsValidatingCode(true)

    try {
      const result = await validateRecoveryCode({ email, code: otp.join("") })

      if (!result.success) {
        onError(result.error)
        return
      }

      if (!result.valid) {
        onError("Código inválido ou expirado. Confira o código ou peça outro.")
        return
      }

      nextStep()
    } finally {
      setIsValidatingCode(false)
    }
  }

  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasNumber: /\d/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    hasUpperAndLower: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
  }

  const validatePasswords = () => {
    if (newPassword.length < 8) {
      setPasswordError("A senha deve ter pelo menos 8 caracteres")
      return false
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem")
      return false
    }

    setPasswordError("")
    return true
  }

  const handlePasswordSubmit = async () => {
    if (!validatePasswords()) return

    setIsSubmittingPassword(true)
    setPasswordError("")

    try {
      const result = await changePasswordWithCode({
        email,
        code: otp.join(""),
        password: newPassword,
      })

      if (!result.success) {
        onError(result.error)
        return
      }

      setIsSuccess(true)
      setNewPassword("")
      setConfirmPassword("")
      setOtp(new Array(6).fill(""))

      setTimeout(() => {
        router.push("/signin")
      }, 2000)
    } catch {
      onError("Não foi possível salvar a nova senha. Tente novamente.")
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value.slice(-1)
    // O código gerado pela API é só de dígitos
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp]
        newOtp[index - 1] = ""
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      } else {
        const newOtp = [...otp]
        newOtp[index] = ""
        setOtp(newOtp)
      }
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").slice(0, 6)
    const newOtp = [...otp]

    pastedData.split("").forEach((value, index) => {
      if (index < 6 && /^\d$/.test(value)) {
        newOtp[index] = value
      }
    })

    setOtp(newOtp)
    if (pastedData.length > 0) {
      inputRefs.current[Math.min(pastedData.length - 1, 5)]?.focus()
    }
  }

  const onSubmit: SubmitHandler<CreateForgotPasswordDataFormData> = async (
    data
  ) => {
    const { email } = data
    setEmail(email)

    try {
      await forgot({ email })

      setEmailSent(true)
      nextStep()
    } catch {
      onError("Não foi possível solicitar o código. Tente novamente.")
    }
  }

  return (
    <main className="bg-white relative z-10 w-full h-full max-lg:h-fit flex flex-col gap-8 shadow-md rounded-4xl px-8 pt-[28px] max-lg:pb-4">
      <div className="w-full">
        <Image src="/logo-cacia.png" alt="mockup" width={200} height={61} />
      </div>

      {step === 1 ? (
        <div className="w-full">
          <Heading
            title="Recuperar senha"
            subtitle="Insira o seu e-mail cadastrado abaixo e enviaremos um código de redefinição de senha"
          />

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full mt-10 flex flex-col items-center justify-center gap-11"
          >
            <Input
              {...register("email")}
              label="E-mail"
              placeholder="Insira o seu e-mail de acesso..."
              iconName="mail"
              error={errors?.email}
            />

            <Button
              type="submit"
              className="w-[251px] cursor-pointer"
              variant="primary"
              iconLeft={<Send />}
              isLoading={isSubmitting}
            >
              Enviar
            </Button>
          </form>
        </div>
      ) : null}

      {step === 2 ? (
        <>
          <Heading
            title="Recuperar senha"
            subtitle="Se o e-mail estiver cadastrado, você receberá um código de 6 dígitos. Insira-o abaixo."
          />

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (otp.join("").length === 6) handleCodeSubmit()
            }}
            className="w-full flex flex-col items-center justify-center gap-11"
          >
            <div className="flex justify-center gap-2 max-md:gap-1">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label={`Dígito ${index + 1} do código`}
                  maxLength={1}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  // placeholder="*"
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  className="w-[75px] h-[75px] max-md:w-[50px] max-md:h-[50px] bg-[#FCFCFD] border border-[#F6F6F9] rounded-2xl outline-0 flex items-center justify-center text-center text-[#707070] text-base max-md:text-sm font-semibold"
                />
              ))}
            </div>

            <Button
              type="button"
              onClick={handleCodeSubmit}
              className="w-[251px] max-md:w-full cursor-pointer"
              variant="primary"
              iconLeft={<Send />}
              isLoading={isValidatingCode}
              disabled={otp.join("").length !== 6 || isValidatingCode}
            >
              Enviar
            </Button>
          </form>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Heading
            title="Recuperar senha"
            subtitle="Preencha os campos abaixo para definir a sua nova senha "
          />

          {/* Enter num campo de senha enviava o formulário nativo e recarregava
              a página, perdendo o código já validado. */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handlePasswordSubmit()
            }}
            className="w-full flex flex-col items-center justify-center gap-11"
          >
            <div className="w-full flex flex-col gap-5">
              <Input
                type="password"
                label="Nova senha"
                placeholder="Insira a sua nova senha de acesso"
                iconName="lock"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Input
                type="password"
                label="Repita a nova senha"
                placeholder="Repita a sua nova senha de acesso"
                iconName="lock"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {passwordError && (
                <p className="text-red-500 text-sm text-center">
                  {passwordError}
                </p>
              )}

              <div className="w-full flex flex-col gap-3.5 p-2.5 border border-[#EFEFEF] rounded-[8px]">
                <div className="flex items-center gap-1.5">
                  <IoMdInformationCircle
                    width={18}
                    height={16}
                    className="text-[#348C98]"
                  />

                  <h3 className="text-base text-[#3D3D3D] font-bold">
                    Sua senha deve possuir:
                  </h3>
                </div>

                <hr className="w-full h-px border-t-0 bg-gray-200" />

                <div className="flex flex-col gap-2">
                  {[
                    {
                      label: "Mínimo 8 caracteres",
                      valid: passwordRules.minLength,
                    },
                    { label: "Números", valid: passwordRules.hasNumber },
                    {
                      label: "Caracteres especiais",
                      valid: passwordRules.hasSpecialChar,
                    },
                    {
                      label: "Letras maiúsculas e minúsculas",
                      valid: passwordRules.hasUpperAndLower,
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
                        className={
                          rule.valid ? "text-[#16A31B]" : "text-[#EFEFEF]"
                        }
                      />
                      <h4 className="text-sm font-bold text-[#707070]">
                        {rule.label}
                      </h4>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handlePasswordSubmit}
              className="w-[251px] max-md:w-full cursor-pointer"
              variant="primary"
              iconLeft={<Send />}
              isLoading={isSubmittingPassword}
            >
              Enviar
            </Button>
          </form>
        </>
      ) : null}

      {error ? (
        <Toast
          onClose={onClose}
          variant="errorSolid"
          title={
            step === 3 ? "Erro ao salvar senha!" : "Não foi possível continuar"
          }
          description={errorMessage}
        />
      ) : null}

      {isSuccess ? (
        <Toast
          onClose={() => setIsSuccess(false)}
          variant="successSolid"
          title="Senha atualizada com sucesso!"
          description="Sua senha foi alterada com sucesso!"
        />
      ) : null}

      {emailSent ? (
        <Toast
          onClose={() => setEmailSent(false)}
          variant="successSolid"
          title="Solicitação recebida"
          description="Se o e-mail estiver cadastrado, você receberá um código de recuperação."
        />
      ) : null}
    </main>
  )
}

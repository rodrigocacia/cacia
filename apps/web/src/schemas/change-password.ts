import { z } from "zod"

export const changePasswordSchema = z
  .object({
    password: z.string().min(1, { message: "Senha atual é obrigatória" }),
    newPassword: z
      .string()
      .min(8, { message: "A nova senha deve ter pelo menos 8 caracteres" }),
    confirmNewPassword: z.string().min(8, {
      message: "A confirmação da senha deve ter pelo menos 8 caracteres",
    }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "As senhas não coincidem",
    path: ["confirmNewPassword"],
  })

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

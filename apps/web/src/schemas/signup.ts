import { z } from "zod"

export const signupFormSchema = z
  .object({
    user_name: z.string().min(6, { message: "Insira pelo menos 6 letras" }),
    user_phone: z
      .string()
      .min(14, { message: "Insira um telefone com 14 dígitos" }),
    user_email: z
      .string()
      .email({ message: "Por favor, insira um email válido" }),
    type_document: z.enum(["CPF", "CNPJ"]),
    type_document_user: z.enum(["CPF", "CNPJ"]),
    user_document: z.string().min(9, { message: "Insira um documento válido" }),
    document: z.string().min(9, { message: "Insira um documento válido" }),
    oab_number: z
      .string()
      .min(1, { message: "Insira um número da OAB válido" }),
    oab_uf: z.string().min(2, { message: "Selecione o estado da OAB" }),
    user_password: z
      .string()
      .min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
    password_confirmation: z.string().min(8, {
      message: "A confirmação da senha deve ter pelo menos 8 caracteres",
    }),
    trade_name: z.string().optional(),
    legal_name: z.string().optional(),
    description: z.string().min(4, { message: "Insira a Biografia" }),
    remotejid: z
      .string()
      .min(14, { message: "Insira um telefone com 14 dígitos" }),
    street: z.string().optional(),
    number: z.string().optional(),
    cep: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    complement: z.string().optional(),
  })
  .refine((data) => data.user_password === data.password_confirmation, {
    message: "As senhas não coincidem",
    path: ["password_confirmation"],
  })
  .superRefine(({ document, type_document }, ctx) => {
    const cleaned = document.replace(/\D/g, "")

    if (type_document === "CPF" && cleaned.length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["document"],
        message: "CPF deve conter 11 dígitos",
      })
    }

    if (type_document === "CNPJ" && cleaned.length !== 14) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["document"],
        message: "CNPJ deve conter 14 dígitos",
      })
    }
  })
  .superRefine(({ user_document, type_document_user }, ctx) => {
    const cleaned = user_document.replace(/\D/g, "")

    if (type_document_user === "CPF" && cleaned.length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["user_document"],
        message: "CPF deve conter 11 dígitos",
      })
    }

    if (type_document_user === "CNPJ" && cleaned.length !== 14) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["user_document"],
        message: "CNPJ deve conter 14 dígitos",
      })
    }
  })
  .superRefine((data, ctx) => {
    if (data.type_document_user === "CNPJ") {
      if (!data.trade_name || data.trade_name.trim().length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["trade_name"],
          message: "Insira o nome ou nome fantasia (mínimo 4 caracteres)",
        })
      }

      if (!data.legal_name || data.legal_name.trim().length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["legal_name"],
          message: "Insira a razão social (mínimo 4 caracteres)",
        })
      }
    }

    const fieldLabels: Record<string, string> = {
      street: "Logradouro",
      number: "Número",
      cep: "CEP",
      neighborhood: "Bairro",
      city: "Cidade",
      state: "Estado",
    }

    const fieldsAddress = [
      "street",
      "number",
      "cep",
      "neighborhood",
      "city",
      "state",
    ]

    const hasAddress = fieldsAddress.some((field) => {
      const value = (data as Record<string, string>)[field]
      return value && value.trim() !== ""
    })

    if (hasAddress) {
      fieldsAddress.forEach((field) => {
        const value = (data as Record<string, string>)[field]
        if (!value || value.trim() === "") {
          ctx.addIssue({
            path: [field],
            code: z.ZodIssueCode.custom,
            message: `O campo ${fieldLabels[field]} é obrigatório ao preencher o endereço`,
          })
        }
      })
    }
  })

export type SignupFormData = z.infer<typeof signupFormSchema>

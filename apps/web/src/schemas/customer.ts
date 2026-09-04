import { z } from "zod"

const fieldLabels: Record<string, string> = {
  street: "Rua",
  number: "Número",
  cep: "CEP",
  neighborhood: "Bairro",
  city: "Cidade",
  state: "Estado",
}

export const customerFormSchema = z
  .object({
    name: z
      .string({ required_error: "O nome é obrigatório" })
      .min(6, { message: "Insira um nome válido com pelo menos 6 letras" }),
    remotejid: z
      .string({ required_error: "O telefone é obrigatório" })
      .min(6, { message: "Insira um telefone válido com pelo menos 6 letras" }),
    email: z
      .string()
      .email({ message: "Por favor, insira um email válido" })
      .optional()
      .or(z.literal("")),
    complement: z.string().optional(),
    type_document: z.enum(["CPF", "CNPJ"]),
    document: z
      .string({ required_error: "O documento é obrigatório" })
      .min(11, { message: "Insira um documento válido" }),
    legal_name: z.string().nullable().optional(),
    trade_name: z.string().nullable().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    cep: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type_document === "CNPJ") {
      if (!data.legal_name || data.legal_name.trim() === "") {
        ctx.addIssue({
          path: ["legal_name"],
          code: z.ZodIssueCode.custom,
          message: "Nome empresarial é obrigatório para CNPJ",
        })
      }

      if (!data.trade_name || data.trade_name.trim() === "") {
        ctx.addIssue({
          path: ["trade_name"],
          code: z.ZodIssueCode.custom,
          message: "Nome fantasia é obrigatório para CNPJ",
        })
      }
    }

    const fieldsAddress = ["street", "number", "cep", "neighborhood", "city"]

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

export type CustomerFormData = z.infer<typeof customerFormSchema>

import { z } from "zod"

export const createServiceFormSchema = z
  .object({
    title: z.string().min(1, { message: "Insira um título válido" }),
    description: z.string().min(1, { message: "Insira uma descrição" }),
    area: z
      .string({ message: "Insira uma área válida" })
      .min(1, { message: "Insira uma área válida" }),
    value_type: z
      .string()
      .min(1, { message: "Insira um tipo de valor válido" }),
    value_fixed: z.string().min(1, { message: "Insira um valor válido" }),
    value_float: z.string().optional().nullable(),
    tax_or_additional: z.string().min(1, { message: "Insira um valor válido" }),
    value_detail: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.tax_or_additional === "yes") {
        return !!data.value_detail?.trim()
      }
      return true
    },
    {
      path: ["value_detail"],
      message: "Campo obrigatório",
    }
  )
  .refine(
    (data) => {
      if (data.value_type === "FLOAT") {
        return !!data.value_float?.trim()
      }
      return true
    },
    {
      path: ["value_float"],
      message: "Valor final obrigatório",
    }
  )

export type CreateServiceFormData = z.infer<typeof createServiceFormSchema>

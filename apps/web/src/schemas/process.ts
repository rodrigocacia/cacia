import { z } from "zod"

export const createProcessFormSchema = z.object({
  customer_id: z.string().min(1, { message: "Insira um cliente válido" }),
  number: z.string().min(1, { message: "Insira um número de processo válido" }),
  description: z.string().min(1, { message: "Insira uma descrição" }),
})

export type CreateProcessFormData = z.infer<typeof createProcessFormSchema>
